.PHONY: help build up down start stop restart logs logs-nextjs logs-mongodb shell-nextjs shell-mongodb clean clean-all backup restore backup-list dev build-dev dev-up dev-down

# Variables
COMPOSE_FILE = docker-compose.yml
COMPOSE_DEV_FILE = docker-compose.dev.yml
DB_NAME = braintrust
DB_USER = admin
DB_PASSWORD = admin123
BACKUP_DIR = ./backups
TIMESTAMP = $(shell date +%Y%m%d_%H%M%S)

# Colors for output
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m # No Color

help: ## Show this help message
	@echo "$(GREEN)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'

build: ## Build Docker images
	@echo "$(GREEN)Building Docker images...$(NC)"
	docker-compose -f $(COMPOSE_FILE) build

up: ## Start all services in detached mode
	@echo "$(GREEN)Starting all services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "$(GREEN)Services started! Next.js: http://localhost:3000$(NC)"

down: ## Stop and remove all containers
	@echo "$(YELLOW)Stopping all services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down

start: up ## Alias for up

stop: down ## Alias for down

restart: ## Restart all services
	@echo "$(GREEN)Restarting all services...$(NC)"
	docker-compose -f $(COMPOSE_FILE) restart

logs: ## Show logs from all services
	docker-compose -f $(COMPOSE_FILE) logs -f

logs-nextjs: ## Show logs from Next.js container only
	docker-compose -f $(COMPOSE_FILE) logs -f nextjs

logs-mongodb: ## Show logs from MongoDB container only
	docker-compose -f $(COMPOSE_FILE) logs -f mongodb

shell-nextjs: ## Open shell in Next.js container
	docker-compose -f $(COMPOSE_FILE) exec nextjs sh

shell-mongodb: ## Open MongoDB shell
	docker-compose -f $(COMPOSE_FILE) exec mongodb mongosh -u $(DB_USER) -p $(DB_PASSWORD) --authenticationDatabase admin

clean: ## Remove stopped containers and unused images
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	docker-compose -f $(COMPOSE_FILE) down -v
	docker system prune -f

clean-all: ## Remove all containers, volumes, and images (WARNING: This removes everything)
	@echo "$(YELLOW)WARNING: This will remove all containers, volumes, and images!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		docker-compose -f $(COMPOSE_FILE) down -v --rmi all; \
		docker system prune -af --volumes; \
		echo "$(GREEN)Cleanup complete!$(NC)"; \
	fi

backup: ## Create a backup of the MongoDB database
	@echo "$(GREEN)Creating MongoDB backup...$(NC)"
	@mkdir -p $(BACKUP_DIR)
	docker-compose -f $(COMPOSE_FILE) exec -T mongodb mongodump \
		--uri="mongodb://$(DB_USER):$(DB_PASSWORD)@localhost:27017/$(DB_NAME)?authSource=admin" \
		--archive > $(BACKUP_DIR)/backup_$(DB_NAME)_$(TIMESTAMP).archive
	@echo "$(GREEN)Backup created: $(BACKUP_DIR)/backup_$(DB_NAME)_$(TIMESTAMP).archive$(NC)"

backup-list: ## List all available backups
	@echo "$(GREEN)Available backups:$(NC)"
	@ls -lh $(BACKUP_DIR)/backup_*.archive 2>/dev/null || echo "No backups found"

restore: ## Restore MongoDB database from backup (usage: make restore BACKUP_FILE=backup_braintrust_20240101_120000.archive)
	@if [ -z "$(BACKUP_FILE)" ]; then \
		echo "$(YELLOW)Error: BACKUP_FILE is required$(NC)"; \
		echo "Usage: make restore BACKUP_FILE=backup_braintrust_20240101_120000.archive"; \
		echo "Available backups:"; \
		ls -1 $(BACKUP_DIR)/backup_*.archive 2>/dev/null || echo "No backups found"; \
		exit 1; \
	fi
	@if [ ! -f "$(BACKUP_DIR)/$(BACKUP_FILE)" ]; then \
		echo "$(YELLOW)Error: Backup file $(BACKUP_DIR)/$(BACKUP_FILE) not found$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)WARNING: This will replace the current database!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo "$(GREEN)Restoring database from $(BACKUP_FILE)...$(NC)"; \
		docker-compose -f $(COMPOSE_FILE) exec -T mongodb mongorestore \
			--uri="mongodb://$(DB_USER):$(DB_PASSWORD)@localhost:27017/$(DB_NAME)?authSource=admin" \
			--archive < $(BACKUP_DIR)/$(BACKUP_FILE) \
			--drop; \
		echo "$(GREEN)Restore complete!$(NC)"; \
	fi

dev: ## Run Next.js in development mode (local, not in Docker)
	@echo "$(GREEN)Starting Next.js in development mode...$(NC)"
	npm run dev

build-dev: ## Build Next.js for development
	@echo "$(GREEN)Building Next.js for development...$(NC)"
	npm run build

status: ## Show status of all containers
	@echo "$(GREEN)Container status:$(NC)"
	docker-compose -f $(COMPOSE_FILE) ps

stats: ## Show resource usage statistics
	@echo "$(GREEN)Resource usage:$(NC)"
	docker stats --no-stream braintrust-nextjs braintrust-mongodb

dev-up: ## Start only MongoDB for development (Next.js runs locally)
	@echo "$(GREEN)Starting MongoDB for development...$(NC)"
	docker-compose -f $(COMPOSE_DEV_FILE) up -d
	@echo "$(GREEN)MongoDB started! Use MONGODB_URI=mongodb://admin:admin123@localhost:27018/braintrust?authSource=admin$(NC)"

dev-down: ## Stop development MongoDB
	@echo "$(YELLOW)Stopping development MongoDB...$(NC)"
	docker-compose -f $(COMPOSE_DEV_FILE) down

