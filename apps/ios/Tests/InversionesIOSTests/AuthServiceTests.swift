import XCTest
@testable import InversionesIOS

final class AuthServiceTests: XCTestCase {
    override func tearDown() {
        URLProtocolStub.handler = nil
        super.tearDown()
    }

    func testLoginReturnsDecodedSession() async throws {
        URLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/auth/login")
            XCTAssertEqual(request.httpMethod, "POST")

            let data = Data("""
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
            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
                httpVersion: nil,
                headerFields: ["Content-Type": "application/json"]
            )!
            return (response, data)
        }

        let session = URLSession(configuration: .stubbed)
        let service = AuthService(baseURL: URL(string: "http://localhost:3000/api/v1")!, session: session)

        let auth = try await service.login(username: "admin", password: "secret")

        XCTAssertEqual(auth.accessToken, "token-123")
        XCTAssertEqual(auth.user.name, "Admin")
    }
}

private final class URLProtocolStub: URLProtocol {
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
    static var stubbed: URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [URLProtocolStub.self]
        return configuration
    }
}
