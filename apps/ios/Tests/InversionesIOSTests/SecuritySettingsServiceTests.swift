import XCTest
@testable import InversionesIOS

final class SecuritySettingsServiceTests: XCTestCase {
    override func tearDown() {
        SecuritySettingsURLProtocolStub.handler = nil
        super.tearDown()
    }

    func testProfileReturnsBackendUser() async throws {
        SecuritySettingsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/auth/profile")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": {
                "id": "u1",
                "name": "Admin",
                "username": "admin",
                "email": "admin@example.com",
                "role": "ADMIN",
                "createdAt": "2026-06-26T12:00:00.000Z"
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = SecuritySettingsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .securitySettingsStubbed)
        )

        let user = try await service.profile(accessToken: "token-123")

        XCTAssertEqual(user.name, "Admin")
        XCTAssertEqual(user.role, "ADMIN")
    }

    func testAuditReturnsRecentEvents() async throws {
        SecuritySettingsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/audit")

            let data = Data("""
            {
              "success": true,
              "data": [
                {
                  "id": "audit-1",
                  "action": "USER_CREATED",
                  "entityType": "User",
                  "entityId": "user-2",
                  "createdAt": "2026-06-26T12:00:00.000Z",
                  "user": { "id": "u1", "name": "Admin" }
                }
              ]
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = SecuritySettingsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .securitySettingsStubbed)
        )

        let events = try await service.audit(accessToken: "token-123")

        XCTAssertEqual(events.first?.action, "USER_CREATED")
        XCTAssertEqual(events.first?.actorName, "Admin")
    }
}

private final class SecuritySettingsURLProtocolStub: URLProtocol {
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
    static var securitySettingsStubbed: URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [SecuritySettingsURLProtocolStub.self]
        return configuration
    }
}
