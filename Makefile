deploy/tagging:
	.cicd/tagging.sh $(branch) $(commit)

deploy/test-all: deploy/test-backend-all deploy/test-frontend-all

deploy/test-backend-all: deploy/test-api deploy/test-api-boss

deploy/test-frontend-all: deploy/test-frontend-boss  deploy/test-frontend

init:
	.cicd/deploy.sh 0-init

package-api:
	.cicd/package.sh

package/frontend-boss:
	.cicd/package-frontend-boss.sh

deploy/test-nginx:
	.cicd/deploy.sh test-nginx

deploy/test-api: package-api
	.cicd/deploy.sh test-api

deploy/test-api-boss: package-api
	.cicd/deploy.sh test-api-boss

deploy/test-frontend:
	.cicd/package-frontend.sh test && .cicd/deploy.sh test-frontend

deploy/test-frontend-boss: package/frontend-boss
	.cicd/deploy.sh test-frontend-boss

deploy/test-toolbox:
	.cicd/deploy.sh test-toolbox

deploy/test-land:
	.cicd/deploy.sh test-land

debug/backend:
	cd nemo-copilot-web && java -jar target/nemo-copilot-web-0.0.1-SNAPSHOT.jar

debug/frontend:
	cd frontend && pnpm run dev:local

debug/frontend-boss:
	cd frontend-boss && pnpm run dev

deploy/openobserve:
	.cicd/deploy.sh openobserve

deploy/otel-collector:
	.cicd/deploy.sh otel-collector
