#!/bin/bash

# 🚀 Enhanced Cybersecurity SaaS Platform - Deployment Script
# This script automates the complete deployment of the AI-powered cybersecurity platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
PLATFORM_NAME="Cybersecurity SaaS Platform"
VERSION="1.0.0"
DEFAULT_DOMAIN="localhost"
DEFAULT_EMAIL="admin@cybersecurity-saas.com"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}  $PLATFORM_NAME${NC}"
    echo -e "${PURPLE}  Version: $VERSION${NC}"
    echo -e "${PURPLE}================================${NC}"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check Node.js (for development)
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -lt 18 ]; then
            print_warning "Node.js version is below 18. Some features may not work properly."
        fi
    fi
    
    print_success "Prerequisites check completed"
}

# Function to setup environment
setup_environment() {
    print_status "Setting up environment..."
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        print_status "Creating .env file..."
        cp .env.example .env 2>/dev/null || {
            print_warning "No .env.example found, creating basic .env file..."
            cat > .env << EOF
# Cybersecurity SaaS Platform Environment Configuration

# Application
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
POSTGRES_PASSWORD=secure_password_$(openssl rand -hex 8)
DATABASE_URL=postgresql://cybersecurity_user:secure_password_123@postgres:5432/cybersecurity_saas

# Redis
REDIS_PASSWORD=redis_password_$(openssl rand -hex 8)
REDIS_URL=redis://:redis_password_123@redis:6379

# Security
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

# AI Services
OPENAI_API_KEY=your_openai_api_key_here

# External APIs
QUAKE_API_KEY=your_quake_api_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token

# Monitoring
GRAFANA_PASSWORD=admin123

# Domain Configuration
DOMAIN=${DOMAIN:-$DEFAULT_DOMAIN}
ADMIN_EMAIL=${ADMIN_EMAIL:-$DEFAULT_EMAIL}
EOF
        }
        print_success ".env file created"
    else
        print_status ".env file already exists"
    fi
    
    # Load environment variables
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
        print_success "Environment variables loaded"
    fi
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Create SSL directory
    mkdir -p nginx/ssl
    
    # Generate self-signed certificate for development
    if [ ! -f nginx/ssl/cert.pem ] || [ ! -f nginx/ssl/key.pem ]; then
        print_status "Generating self-signed SSL certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=${DOMAIN:-$DEFAULT_DOMAIN}"
        print_success "SSL certificate generated"
    else
        print_status "SSL certificates already exist"
    fi
}

# Function to setup database initialization
setup_database() {
    print_status "Setting up database initialization..."
    
    # Create database init directory
    mkdir -p database/init
    
    # Create database initialization script
    if [ ! -f database/init/01-init.sql ]; then
        print_status "Creating database initialization script..."
        cat > database/init/01-init.sql << 'EOF'
-- Cybersecurity SaaS Platform Database Initialization

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'user', 'viewer');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'professional', 'enterprise');
CREATE TYPE threat_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE scan_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    subscription_tier subscription_tier DEFAULT 'free',
    max_users INTEGER DEFAULT 5,
    max_scans_per_month INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create api_keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    permissions JSONB DEFAULT '{}',
    last_used TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_scans table
CREATE TABLE security_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    target_url TEXT NOT NULL,
    scan_type VARCHAR(100) NOT NULL,
    status scan_status DEFAULT 'pending',
    parameters JSONB DEFAULT '{}',
    results JSONB,
    risk_level threat_level,
    confidence_score DECIMAL(3,2),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create threat_intelligence table
CREATE TABLE threat_intelligence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    threat_type VARCHAR(100) NOT NULL,
    source VARCHAR(255),
    description TEXT,
    threat_level threat_level NOT NULL,
    indicators JSONB,
    mitigation_steps TEXT[],
    confidence_score DECIMAL(3,2),
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_security_scans_organization_id ON security_scans(organization_id);
CREATE INDEX idx_security_scans_status ON security_scans(status);
CREATE INDEX idx_threat_intelligence_organization_id ON threat_intelligence(organization_id);
CREATE INDEX idx_threat_intelligence_threat_level ON threat_intelligence(threat_level);
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create admin user and organization
INSERT INTO organizations (id, name, domain, subscription_tier, max_users, max_scans_per_month)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Default Organization',
    'localhost',
    'enterprise',
    1000,
    10000
);

-- Insert admin user (password: admin123)
INSERT INTO users (id, organization_id, email, password_hash, first_name, last_name, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@cybersecurity-saas.com',
    crypt('admin123', gen_salt('bf')),
    'Admin',
    'User',
    'admin'
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

print_success "Database initialization script created"
    else
        print_status "Database initialization script already exists"
    fi
}

# Function to setup monitoring configuration
setup_monitoring() {
    print_status "Setting up monitoring configuration..."
    
    # Create monitoring directory
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    # Create Prometheus configuration
    if [ ! -f monitoring/prometheus.yml ]; then
        print_status "Creating Prometheus configuration..."
        cat > monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'cybersecurity-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'cybersecurity-frontend'
    static_configs:
      - targets: ['frontend:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    metrics_path: '/metrics'
    scrape_interval: 30s
EOF
        print_success "Prometheus configuration created"
    fi
    
    # Create Grafana datasource configuration
    if [ ! -f monitoring/grafana/datasources/prometheus.yml ]; then
        print_status "Creating Grafana datasource configuration..."
        cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF
        print_success "Grafana datasource configuration created"
    fi
    
    # Create Grafana dashboard configuration
    if [ ! -f monitoring/grafana/dashboards/dashboards.yml ]; then
        print_status "Creating Grafana dashboard configuration..."
        cat > monitoring/grafana/dashboards/dashboards.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF
        print_success "Grafana dashboard configuration created"
    fi
    
    # Create Filebeat configuration
    if [ ! -f monitoring/filebeat.yml ]; then
        print_status "Creating Filebeat configuration..."
        cat > monitoring/filebeat.yml << 'EOF'
filebeat.inputs:
- type: container
  paths:
    - '/var/lib/docker/containers/*/*.log'

processors:
- add_docker_metadata:
    host: "unix:///var/run/docker.sock"

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  indices:
    - index: "filebeat-%{[agent.version]}-%{+yyyy.MM.dd}"

setup.kibana:
  host: "kibana:5601"
EOF
        print_success "Filebeat configuration created"
    fi
}

# Function to setup Nginx configuration
setup_nginx() {
    print_status "Setting up Nginx configuration..."
    
    # Create nginx directory
    mkdir -p nginx
    
    # Create Nginx configuration
    if [ ! -f nginx/nginx.conf ]; then
        print_status "Creating Nginx configuration..."
        cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }
    
    upstream backend {
        server backend:5000;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    server {
        listen 80;
        server_name localhost;
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name localhost;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        
        # Frontend
        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Backend API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location /health {
            proxy_pass http://backend;
        }
        
        # Metrics
        location /metrics {
            proxy_pass http://backend;
        }
    }
}
EOF
        print_success "Nginx configuration created"
    fi
}

# Function to build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service status
    print_status "Checking service status..."
    docker-compose ps
    
    print_success "Services deployed successfully"
}

# Function to setup initial data
setup_initial_data() {
    print_status "Setting up initial data..."
    
    # Wait for database to be ready
    print_status "Waiting for database to be ready..."
    sleep 60
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose exec backend npm run db:migrate || {
        print_warning "Database migration failed, this is normal for first deployment"
    }
    
    print_success "Initial data setup completed"
}

# Function to display deployment information
display_deployment_info() {
    print_success "Deployment completed successfully!"
    echo ""
    echo -e "${GREEN}🎉 $PLATFORM_NAME is now running!${NC}"
    echo ""
    echo -e "${CYAN}Access URLs:${NC}"
    echo -e "  Frontend:     ${GREEN}https://localhost${NC}"
    echo -e "  Backend API:  ${GREEN}https://localhost/api${NC}"
    echo -e "  Grafana:      ${GREEN}http://localhost:3001${NC} (admin/admin123)"
    echo -e "  Prometheus:   ${GREEN}http://localhost:9090${NC}"
    echo -e "  Kibana:       ${GREEN}http://localhost:5601${NC}"
    echo ""
    echo -e "${CYAN}Default Admin Account:${NC}"
    echo -e "  Email:        ${GREEN}admin@cybersecurity-saas.com${NC}"
    echo -e "  Password:     ${GREEN}admin123${NC}"
    echo ""
    echo -e "${YELLOW}Important:${NC}"
    echo -e "  - Change default passwords after first login"
    echo -e "  - Configure your API keys in the .env file"
    echo -e "  - Set up proper SSL certificates for production"
    echo ""
    echo -e "${CYAN}Useful Commands:${NC}"
    echo -e "  View logs:    ${GREEN}docker-compose logs -f${NC}"
    echo -e "  Stop:         ${GREEN}docker-compose down${NC}"
    echo -e "  Restart:      ${GREEN}docker-compose restart${NC}"
    echo -e "  Update:       ${GREEN}./deploy.sh --update${NC}"
    echo ""
}

# Function to update existing deployment
update_deployment() {
    print_status "Updating existing deployment..."
    
    # Pull latest changes
    git pull origin main
    
    # Stop services
    docker-compose down
    
    # Rebuild and restart
    deploy_services
    
    # Setup initial data
    setup_initial_data
    
    print_success "Update completed successfully"
}

# Function to cleanup
cleanup() {
    print_status "Cleaning up..."
    
    # Stop and remove containers
    docker-compose down -v
    
    # Remove images
    docker-compose down --rmi all
    
    # Remove volumes
    docker volume prune -f
    
    print_success "Cleanup completed"
}

# Function to show help
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -d, --domain        Set custom domain (default: localhost)"
    echo "  -e, --email         Set admin email (default: admin@cybersecurity-saas.com)"
    echo "  -u, --update        Update existing deployment"
    echo "  -c, --cleanup       Clean up deployment and remove all data"
    echo "  -s, --ssl-only      Setup SSL certificates only"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy with default settings"
    echo "  $0 -d example.com     # Deploy with custom domain"
    echo "  $0 -u                 # Update existing deployment"
    echo "  $0 -c                 # Clean up deployment"
    echo ""
}

# Main deployment function
main() {
    print_header
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -e|--email)
                ADMIN_EMAIL="$2"
                shift 2
                ;;
            -u|--update)
                UPDATE_MODE=true
                shift
                ;;
            -c|--cleanup)
                cleanup
                exit 0
                ;;
            -s|--ssl-only)
                setup_ssl
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    if [ "$UPDATE_MODE" = true ]; then
        update_deployment
    else
        # Full deployment
        check_prerequisites
        setup_environment
        setup_ssl
        setup_database
        setup_monitoring
        setup_nginx
        deploy_services
        setup_initial_data
    fi
    
    display_deployment_info
}

# Run main function with all arguments
main "$@"