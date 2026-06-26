import XCTest
@testable import InversionesIOS

final class UpcomingPaymentsServiceTests: XCTestCase {
    override func tearDown() {
        UpcomingPaymentsURLProtocolStub.handler = nil
        super.tearDown()
    }

    func testListReturnsDecodedUpcomingPayments() async throws {
        UpcomingPaymentsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/reports/payments/upcoming")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": [
                {
                  "id": "schedule-1",
                  "clientName": "Ana Diaz",
                  "dueDate": "2026-06-27T00:00:00.000Z",
                  "amount": 1000,
                  "status": "PENDING"
                }
              ]
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = UpcomingPaymentsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .upcomingPaymentsStubbed)
        )

        let payments = try await service.list(accessToken: "token-123")

        XCTAssertEqual(payments.first?.clientName, "Ana Diaz")
        XCTAssertEqual(payments.first?.amount, 1000)
    }
}

private final class UpcomingPaymentsURLProtocolStub: URLProtocol {
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
    static var upcomingPaymentsStubbed: URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [UpcomingPaymentsURLProtocolStub.self]
        return configuration
    }
}
