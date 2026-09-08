DOCKER_COMPOSE = docker compose

# Detect host IP
HOST_IP := $(shell \
	if command -v ip >/dev/null 2>&1; then \
		ip route get 1.1.1.1 2>/dev/null | awk '{for(i=1;i<=NF;i++) if($$i=="src") {print $$(i+1); exit}}'; \
	elif command -v ipconfig >/dev/null 2>&1; then \
		ipconfig getifaddr en0 2>/dev/null; \
	fi \
)

export HOST_IP

all: up

up:
	@echo "Detected HOST_IP=$(HOST_IP)"

	@echo "Updating .env..."
	@sed -i.tmp "s|^HOST_IP=.*|HOST_IP=$(HOST_IP)|" .env
	@sed -i.tmp "s|^FRONTEND_URL=.*|FRONTEND_URL=https://$(HOST_IP):3000|" .env
	@rm -f .env.tmp

	@echo "Updating frontend/.env..."
	@sed -i.tmp "s|^VITE_BASE_API_URL=.*|VITE_BASE_API_URL=\"\"|" frontend/.env
	@sed -i.tmp "s|^VITE_FASTAPI_URL=.*|VITE_FASTAPI_URL=\"https://$(HOST_IP):8443\"|" frontend/.env
	@sed -i.tmp "s|^VITE_WS_BASE_URL=.*|VITE_WS_BASE_URL=\"wss://$(HOST_IP):8443\"|" frontend/.env
	@rm -f frontend/.env.tmp

	@echo "Preparing local HTTPS certificates..."
	@bash scripts/generate-local-certs.sh
	@echo "Building and starting containers..."
	$(DOCKER_COMPOSE) up -d --build

# migrate:
	@sleep 3
	@echo "Checking for model changes and creating migration files..."
	docker exec django_backend python manage.py makemigrations
	@echo "Applying migrations to PostgreSQL..."
	docker exec django_backend python manage.py migrate
	@echo "Database is fully synced"
	@echo "Now configuring Github Oauth"
	docker exec django_backend python setup_oauth.py
	@echo "HOST_IP: $(HOST_IP)"

down:
	@echo "Stopping containers..."
	$(DOCKER_COMPOSE) down

clean: down
	@echo "Cleaned up containers."

fclean:
	@echo "WARNING: This will DESTROY the database and all volumes! ⚠️"
	@read -p "Are you ABSOLUTELY sure you want to wipe data? Type 'yes' to continue: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "Stopping all global containers to release resources..."; \
		docker stop $$(docker ps -aq) 2>/dev/null || true; \
		echo "Nuking project and forcing volume removal..."; \
		$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans; \
		echo "Pruning remaining dangling volumes and system cache..."; \
		docker volume prune -f; \
		docker system prune -f; \
	else \
		echo "Aborted fclean. Your data is safe."; \
	fi

re: clean all

.PHONY: all up down clean re fclean