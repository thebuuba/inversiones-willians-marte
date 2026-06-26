import XCTest
@testable import InversionesIOS

final class LoansServiceTests: XCTestCase {
    override func tearDown() {
        LoansURLProtocolStub.handler = nil
        super.tearDown()
    }

    func testListReturnsDecodedLoans() async throws {
        LoansURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/loans?take=50&skip=0")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": {
                "data": [
                  {
                    "id": "loan-1",
                    "loanNumber": 44,
                    "clientId": 1,
                    "productId": "product-1",
                    "principal": 10000,
                    "interestRate": 10,
                    "interestType": "FLAT",
                    "totalAmount": 12000,
                    "paymentFreq": "MONTHLY",
                    "term": 12,
                    "startDate": "2026-06-01T00:00:00.000Z",
                    "endDate": "2027-06-01T00:00:00.000Z",
                    "status": "ACTIVE",
                    "balance": 7000,
                    "notes": null,
                    "createdAt": "2026-06-01T00:00:00.000Z",
                    "client": {
                      "id": 1,
                      "firstName": "Ana",
                      "lastName": "Diaz",
                      "identification": "001"
                    },
                    "product": {
                      "id": "product-1",
                      "name": "Personal"
                    }
                  }
                ],
                "total": 1
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = LoansService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .loansStubbed)
        )

        let page = try await service.list(accessToken: "token-123")

        XCTAssertEqual(page.total, 1)
        XCTAssertEqual(page.data.first?.loanNumber, 44)
        XCTAssertEqual(page.data.first?.client.fullName, "Ana Diaz")
        XCTAssertEqual(page.data.first?.balance, 7000)
    }

    func testDetailReturnsDecodedLoanScheduleAndPayments() async throws {
        LoansURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/loans/loan-1")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": {
                "id": "loan-1",
                "loanNumber": 44,
                "clientId": 1,
                "productId": "product-1",
                "principal": 10000,
                "interestRate": 10,
                "interestType": "FLAT",
                "totalAmount": 12000,
                "paymentFreq": "MONTHLY",
                "term": 12,
                "startDate": "2026-06-01T00:00:00.000Z",
                "endDate": "2027-06-01T00:00:00.000Z",
                "status": "ACTIVE",
                "balance": 7000,
                "notes": null,
                "createdAt": "2026-06-01T00:00:00.000Z",
                "client": {
                  "id": 1,
                  "firstName": "Ana",
                  "lastName": "Diaz",
                  "identification": "001"
                },
                "product": {
                  "id": "product-1",
                  "name": "Personal"
                },
                "schedule": [
                  {
                    "id": "schedule-1",
                    "loanId": "loan-1",
                    "dueDate": "2026-07-01T00:00:00.000Z",
                    "amount": 1000,
                    "principalPart": 900,
                    "interestPart": 100,
                    "balanceAfter": 9000,
                    "status": "PENDING",
                    "paidDate": null,
                    "paidAmount": null
                  }
                ],
                "payments": [
                  {
                    "id": "payment-1",
                    "amount": 500,
                    "paymentDate": "2026-06-15T00:00:00.000Z",
                    "paymentMethod": "cash",
                    "reference": null,
                    "notes": null
                  }
                ],
                "lateFees": []
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = LoansService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .loansStubbed)
        )

        let detail = try await service.detail(accessToken: "token-123", id: "loan-1")

        XCTAssertEqual(detail.loanNumber, 44)
        XCTAssertEqual(detail.schedule.first?.amount, 1000)
        XCTAssertEqual(detail.payments.first?.amount, 500)
    }

    func testCreateReturnsDecodedLoan() async throws {
        LoansURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/loans")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": {
                "id": "loan-1",
                "loanNumber": 44,
                "clientId": 1,
                "productId": "product-1",
                "principal": 10000,
                "interestRate": 10,
                "interestType": "FLAT",
                "totalAmount": 12000,
                "paymentFreq": "MONTHLY",
                "term": 12,
                "startDate": "2026-06-01T00:00:00.000Z",
                "endDate": "2027-06-01T00:00:00.000Z",
                "status": "ACTIVE",
                "balance": 12000,
                "notes": null,
                "createdAt": "2026-06-01T00:00:00.000Z",
                "client": { "id": 1, "firstName": "Ana", "lastName": "Diaz", "identification": "001" },
                "product": { "id": "product-1", "name": "Personal" }
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 201, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = LoansService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .loansStubbed)
        )

        let loan = try await service.create(
            accessToken: "token-123",
            input: CreateLoanInput(
                clientId: 1,
                productId: "product-1",
                principal: 10000,
                term: 12,
                startDate: "2026-06-26"
            )
        )

        XCTAssertEqual(loan.loanNumber, 44)
        XCTAssertEqual(loan.balance, 12000)
    }
}

private final class LoansURLProtocolStub: URLProtocol {
    nonisolated(unsafe) static var handler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        do {
            let (response, data) = try Self.handler?(request) ?? {
                throw URLError(.badServerResponse)
            }()
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

private extension URLSessionConfiguration {
    static var loansStubbed: URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [LoansURLProtocolStub.self]
        return configuration
    }
}
