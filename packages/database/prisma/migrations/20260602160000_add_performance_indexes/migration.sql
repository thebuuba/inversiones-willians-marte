-- Indexes supporting frequently filtered and ordered lists
CREATE INDEX "users_role_active_idx" ON "users"("role", "active");
CREATE INDEX "clients_active_created_at_idx" ON "clients"("active", "created_at");
CREATE INDEX "loan_requests_status_idx" ON "loan_requests"("status");
CREATE INDEX "loan_requests_created_at_idx" ON "loan_requests"("created_at");
CREATE INDEX "loan_products_active_name_idx" ON "loan_products"("active", "name");
CREATE INDEX "investors_created_at_idx" ON "investors"("created_at");
CREATE INDEX "tasks_status_priority_due_date_created_at_idx" ON "tasks"("status" ASC, "priority" DESC, "due_date" ASC, "created_at" DESC);
CREATE INDEX "portfolios_created_at_idx" ON "portfolios"("created_at");
CREATE INDEX "audit_logs_entity_type_entity_id_created_at_idx" ON "audit_logs"("entity_type", "entity_id", "created_at");

-- Loans: client navigation, dashboard status filters, portfolios and weekly movement
CREATE INDEX "loans_client_id_created_at_idx" ON "loans"("client_id", "created_at");
CREATE INDEX "loans_status_created_at_idx" ON "loans"("status", "created_at");
CREATE INDEX "loans_created_at_idx" ON "loans"("created_at");
CREATE INDEX "loans_portfolio_id_idx" ON "loans"("portfolio_id");
CREATE INDEX "loans_start_date_idx" ON "loans"("start_date");
CREATE INDEX "loans_status_end_date_idx" ON "loans"("status", "end_date");

-- Installments: loan detail, upcoming collections and overdue-loan checks
CREATE INDEX "payment_schedule_loan_id_due_date_idx" ON "payment_schedule"("loan_id", "due_date");
CREATE INDEX "payment_schedule_due_date_status_idx" ON "payment_schedule"("due_date", "status");
CREATE INDEX "payment_schedule_status_loan_id_idx" ON "payment_schedule"("status", "loan_id");

-- Payments and their allocations
CREATE INDEX "payments_loan_id_payment_date_idx" ON "payments"("loan_id", "payment_date");
CREATE INDEX "payments_client_id_idx" ON "payments"("client_id");
CREATE INDEX "payments_received_by_idx" ON "payments"("received_by");
CREATE INDEX "payments_payment_date_idx" ON "payments"("payment_date");
CREATE INDEX "payment_allocations_payment_id_idx" ON "payment_allocations"("payment_id");
CREATE INDEX "payment_allocations_schedule_id_idx" ON "payment_allocations"("schedule_id");

-- Related child records used from client, investor, loan and schedule relations
CREATE INDEX "late_fees_loan_id_idx" ON "late_fees"("loan_id");
CREATE INDEX "late_fees_schedule_id_idx" ON "late_fees"("schedule_id");
CREATE INDEX "documents_client_id_created_at_idx" ON "documents"("client_id", "created_at");
CREATE INDEX "documents_investor_id_created_at_idx" ON "documents"("investor_id", "created_at");
