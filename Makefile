DOCKER_COMPOSE = docker compose

all: up

up:
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