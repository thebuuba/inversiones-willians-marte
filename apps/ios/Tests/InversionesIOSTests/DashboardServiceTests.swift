import XCTest
@testable import InversionesIOS

final class DashboardServiceTests: XCTestCase {
    override func tearDown() {
        DashboardURLProtocolStub.handler = nil
        super.tearDown()
    }

    func testGetReturnsDecodedDashboard() async throws {
        DashboardURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/reports/dashboard")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": {
                "activeLoans": 4,
                "totalClients": 12,
                "collectionsToday": 1500,
                "portfolioBalance": 42000,
                "overdueLoans": 1
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = DashboardService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .dashboardStubbed)
        )

        let dashboard = try await service.get(accessToken: "token-123")

        XCTAssertEqual(dashboard.activeLoans, 4)
        XCTAssertEqual(dashboard.totalClients, 12)
        XCTAssertEqual(dashboard.collectionsToday, 1500)
        XCTAssertEqual(dashboard.portfolioBalance, 42000)
        XCTAssertEqual(dashboard.overdueLoans, 1)
    }
}

private final class DashboardURLProtocolStub: URLProtocol {
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
    static var dashboardStubbed: URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [DashboardURLProtocolStub.self]
        return configuration
    }
}
