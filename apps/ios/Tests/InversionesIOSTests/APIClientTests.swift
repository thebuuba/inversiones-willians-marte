import XCTest
@testable import InversionesIOS

final class APIClientTests: XCTestCase {
    func testLoginRequestUsesBackendLoginEndpoint() throws {
        let request = try APIClient.loginRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            username: "admin",
            password: "secret"
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/auth/login")
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        XCTAssertEqual(String(data: request.httpBody ?? Data(), encoding: .utf8), #"{"username":"admin","password":"secret"}"#)
    }

    func testDecodesWrappedLoginResponse() throws {
        let json = Data("""
        {
          "success": true,
          "data": {
            "accessToken": "token-123",
            "user": {
              "id": "u1",
              "name": "Admin",
              "username": "admin",
              "email": "admin@example.com",
              "role": "ADMIN"
            }
          }
        }
        """.utf8)

        let response = try JSONDecoder.inversiones.decode(APIResponse<AuthSession>.self, from: json)

        XCTAssertTrue(response.success)
        XCTAssertEqual(response.data?.accessToken, "token-123")
        XCTAssertEqual(response.data?.user.username, "admin")
    }

    func testClientsRequestUsesBearerTokenAndPagination() throws {
        let request = try APIClient.clientsRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            take: 25,
            skip: 50
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/clients?take=25&skip=50")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
    }

    func testLoansRequestUsesBearerTokenAndPagination() throws {
        let request = try APIClient.loansRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            take: 25,
            skip: 50
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/loans?take=25&skip=50")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
    }

    func testLoanDetailRequestUsesBackendEndpoint() throws {
        let request = try APIClient.loanDetailRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            id: "loan-1"
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/loans/loan-1")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
    }

    func testCreatePaymentRequestUsesBackendContract() throws {
        let request = try APIClient.createPaymentRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            input: CreatePaymentInput(
                loanId: "loan-1",
                clientId: 1,
                amount: 500,
                paymentDate: "2026-06-26",
                paymentMethod: "cash",
                reference: nil,
                notes: "abono"
            )
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/payments")
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        let body = try JSONSerialization.jsonObject(with: request.httpBody ?? Data()) as? [String: Any]
        XCTAssertEqual(body?["loanId"] as? String, "loan-1")
        XCTAssertEqual(body?["clientId"] as? Int, 1)
        XCTAssertEqual(body?["amount"] as? Double, 500)
        XCTAssertEqual(body?["paymentDate"] as? String, "2026-06-26")
        XCTAssertEqual(body?["paymentMethod"] as? String, "cash")
        XCTAssertEqual(body?["notes"] as? String, "abono")
    }

    func testLoanProductsRequestUsesBackendEndpoint() throws {
        let request = try APIClient.loanProductsRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123"
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/loan-products")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
    }

    func testDashboardRequestUsesBackendEndpoint() throws {
        let request = try APIClient.dashboardRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123"
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/reports/dashboard")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
    }

    func testUpcomingPaymentsRequestUsesBackendEndpoint() throws {
        let request = try APIClient.upcomingPaymentsRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123"
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/reports/payments/upcoming")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
    }

    func testRequestsRequestUsesBackendEndpoint() throws {
        let request = try APIClient.requestsRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123"
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/requests")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
    }

    func testCreateRequestRequestUsesBackendContract() throws {
        let request = try APIClient.createRequestRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            input: CreateRequestInput(
                firstName: "Ana",
                lastName: "Diaz",
                identification: "001",
                phone: "809-555-0000",
                amount: 15000,
                description: "Capital de trabajo",
                reference: "Referida"
            )
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/requests")
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        let body = try JSONSerialization.jsonObject(with: request.httpBody ?? Data()) as? [String: Any]
        XCTAssertEqual(body?["firstName"] as? String, "Ana")
        XCTAssertEqual(body?["lastName"] as? String, "Diaz")
        XCTAssertEqual(body?["identification"] as? String, "001")
        XCTAssertEqual(body?["phone"] as? String, "809-555-0000")
        XCTAssertEqual(body?["amount"] as? Double, 15000)
        XCTAssertEqual(body?["description"] as? String, "Capital de trabajo")
        XCTAssertEqual(body?["reference"] as? String, "Referida")
    }

    func testApproveRequestRequestUsesBackendEndpoint() throws {
        let request = try APIClient.approveRequestRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            id: "request-1"
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/requests/request-1/approve")
        XCTAssertEqual(request.httpMethod, "PATCH")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
    }

    func testRejectRequestRequestUsesBackendEndpoint() throws {
        let request = try APIClient.rejectRequestRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            id: "request-1"
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/requests/request-1/reject")
        XCTAssertEqual(request.httpMethod, "PATCH")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
    }

    func testCreateLoanRequestUsesBackendContract() throws {
        let request = try APIClient.createLoanRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            input: CreateLoanInput(
                clientId: 1,
                productId: "product-1",
                principal: 10000,
                term: 12,
                startDate: "2026-06-26",
                notes: "nuevo"
            )
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/loans")
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        let body = try JSONSerialization.jsonObject(with: request.httpBody ?? Data()) as? [String: Any]
        XCTAssertEqual(body?["clientId"] as? Int, 1)
        XCTAssertEqual(body?["productId"] as? String, "product-1")
        XCTAssertEqual(body?["principal"] as? Double, 10000)
        XCTAssertEqual(body?["term"] as? Int, 12)
        XCTAssertEqual(body?["startDate"] as? String, "2026-06-26")
        XCTAssertEqual(body?["notes"] as? String, "nuevo")
    }

    func testCreateClientRequestUsesBackendContract() throws {
        let request = try APIClient.createClientRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            input: CreateClientInput(
                firstName: "Ana",
                lastName: "Diaz",
                phone: "809-555-0000",
                identification: "001"
            )
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/clients")
        XCTAssertEqual(request.httpMethod, "POST")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
        let body = try JSONSerialization.jsonObject(with: request.httpBody ?? Data()) as? [String: String]
        XCTAssertEqual(body?["firstName"], "Ana")
        XCTAssertEqual(body?["lastName"], "Diaz")
        XCTAssertEqual(body?["phone"], "809-555-0000")
        XCTAssertEqual(body?["identification"], "001")
    }

    func testClientDetailRequestUsesBackendEndpoint() throws {
        let request = try APIClient.clientDetailRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            id: 7
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/clients/7")
        XCTAssertEqual(request.httpMethod, "GET")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
    }

    func testUpdateClientRequestUsesBackendContract() throws {
        let request = try APIClient.updateClientRequest(
            baseURL: URL(string: "http://192.168.1.4:3000/api/v1")!,
            accessToken: "token-123",
            id: 7,
            input: CreateClientInput(firstName: "Ana", lastName: "Diaz", phone: nil, identification: "001")
        )

        XCTAssertEqual(request.url?.absoluteString, "http://192.168.1.4:3000/api/v1/clients/7")
        XCTAssertEqual(request.httpMethod, "PATCH")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")
    }
}
