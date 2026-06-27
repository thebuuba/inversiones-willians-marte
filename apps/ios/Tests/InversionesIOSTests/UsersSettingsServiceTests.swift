import XCTest
@testable import InversionesIOS

final class UsersSettingsServiceTests: XCTestCase {
    override func tearDown() {
        UsersSettingsURLProtocolStub.handler = nil
        super.tearDown()
    }

    func testListReturnsDecodedUsers() async throws {
        UsersSettingsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/users")
            XCTAssertEqual(request.httpMethod, "GET")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": [
                {
                  "id": "user-2",
                  "name": "Cobrador",
                  "username": "collector",
                  "email": "collector@example.com",
                  "role": "COLLECTOR",
                  "active": true,
                  "createdAt": "2026-06-26T12:00:00.000Z"
                }
              ]
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = UsersSettingsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .usersSettingsStubbed)
        )

        let users = try await service.list(accessToken: "token-123")

        XCTAssertEqual(users.first?.name, "Cobrador")
        XCTAssertEqual(users.first?.roleLabel, "Cobrador")
        XCTAssertEqual(users.first?.active, true)
    }

    func testCreateReturnsDecodedUser() async throws {
        UsersSettingsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/users")
            XCTAssertEqual(request.httpMethod, "POST")

            let data = Data("""
            {
              "success": true,
              "data": {
                "id": "user-2",
                "name": "Cobrador",
                "username": "collector",
                "email": "collector@example.com",
                "role": "COLLECTOR",
                "active": true,
                "createdAt": "2026-06-26T12:00:00.000Z"
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 201, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = UsersSettingsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .usersSettingsStubbed)
        )

        let user = try await service.create(
            accessToken: "token-123",
            input: CreateUserInput(
                name: "Cobrador",
                username: "collector",
                email: "collector@example.com",
                password: "Secret12345",
                role: "COLLECTOR"
            )
        )

        XCTAssertEqual(user.id, "user-2")
        XCTAssertEqual(user.active, true)
    }

    func testToggleActiveReturnsDecodedUser() async throws {
        UsersSettingsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/users/user-2/toggle-active")
            XCTAssertEqual(request.httpMethod, "POST")

            let data = Data("""
            {
              "success": true,
              "data": {
                "id": "user-2",
                "name": "Cobrador",
                "username": "collector",
                "email": "collector@example.com",
                "role": "COLLECTOR",
                "active": false
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = UsersSettingsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .usersSettingsStubbed)
        )

        let user = try await service.toggleActive(accessToken: "token-123", id: "user-2")

        XCTAssertEqual(user.active, false)
    }
}

private final class UsersSettingsURLProtocolStub: URLProtocol {
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
    static var usersSettingsStubbed: URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [UsersSettingsURLProtocolStub.self]
        return configuration
    }
}
