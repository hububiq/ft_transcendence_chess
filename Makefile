DOCKER_COMPOSE = docker compose

all: up

up:
	@echo "Building and starting containers..."
	$(DOCKER_COMPOSE) up -d --build

down:
	@echo "Stopping containers..."
	$(DOCKER_COMPOSE) down

migrate:
	@echo "Waiting 3 seconds for database to be fully ready..."
	@sleep 3
	@echo "Checking for model changes and creating migration files..."
	docker exec -it django_backend python manage.py makemigrations
	@echo "Applying migrations to PostgreSQL..."
	docker exec -it django_backend python manage.py migrate
	@echo "Database is fully synced!"

clean: down
	@echo "Cleaned up containers."

fclean:
	@echo "WARNING: This will DESTROY the database and all volumes! ⚠️"
	@read -p "Are you ABSOLUTELY sure you want to wipe data? Type 'yes' to continue: " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		echo "Nuking project..."; \
		$(DOCKER_COMPOSE) down -v --rmi all --remove-orphans; \
	else \
		echo "Aborted fclean. Your data is safe."; \
	fi

re: fclean all

.PHONY: all up down clean re fclean