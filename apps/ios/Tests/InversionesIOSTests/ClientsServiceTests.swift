import XCTest
@testable import InversionesIOS

final class ClientsServiceTests: XCTestCase {
    override func tearDown() {
        ClientsURLProtocolStub.handler = nil
        super.tearDown()
    }

    func testListReturnsDecodedClients() async throws {
        ClientsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/clients?take=50&skip=0")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": {
                "data": [
                  {
                    "id": 1,
                    "firstName": "Ana",
                    "lastName": "Diaz",
                    "phone": "809-555-0000",
                    "identification": "001",
                    "_count": { "loans": 2 }
                  }
                ],
                "total": 1
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = ClientsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .clientsStubbed)
        )

        let page = try await service.list(accessToken: "token-123")

        XCTAssertEqual(page.total, 1)
        XCTAssertEqual(page.data.first?.fullName, "Ana Diaz")
        XCTAssertEqual(page.data.first?.loanCount, 2)
    }

    func testCreateReturnsDecodedClient() async throws {
        ClientsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/clients")
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": {
                "id": 1,
                "firstName": "Ana",
                "lastName": "Diaz",
                "phone": "809-555-0000",
                "identification": "001",
                "_count": { "loans": 0 }
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 201, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = ClientsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .clientsStubbed)
        )

        let client = try await service.create(
            accessToken: "token-123",
            input: CreateClientInput(firstName: "Ana", lastName: "Diaz", phone: "809-555-0000", identification: "001")
        )

        XCTAssertEqual(client.fullName, "Ana Diaz")
        XCTAssertEqual(client.loanCount, 0)
    }

    func testDetailReturnsClientWithLoans() async throws {
        ClientsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/clients/1")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": {
                "id": 1,
                "firstName": "Ana",
                "lastName": "Diaz",
                "phone": "809-555-0000",
                "identification": "001",
                "active": true,
                "loans": [
                  {
                    "id": "loan-1",
                    "loanNumber": 44,
                    "principal": 10000,
                    "totalAmount": 12000,
                    "balance": 7000,
                    "status": "ACTIVE",
                    "product": { "name": "Personal" }
                  }
                ]
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = ClientsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .clientsStubbed)
        )

        let detail = try await service.detail(accessToken: "token-123", id: 1)

        XCTAssertEqual(detail.fullName, "Ana Diaz")
        XCTAssertEqual(detail.loans.first?.loanNumber, 44)
        XCTAssertEqual(detail.loans.first?.balance, 7000)
    }

    func testUpdateReturnsDecodedClient() async throws {
        ClientsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/clients/1")
            XCTAssertEqual(request.httpMethod, "PATCH")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer token-123")

            let data = Data("""
            {
              "success": true,
              "data": {
                "id": 1,
                "firstName": "Ana",
                "lastName": "Diaz",
                "phone": "809-555-1111",
                "identification": "001",
                "_count": { "loans": 0 }
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = ClientsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .clientsStubbed)
        )

        let client = try await service.update(
            accessToken: "token-123",
            id: 1,
            input: CreateClientInput(firstName: "Ana", lastName: "Diaz", phone: "809-555-1111", identification: "001")
        )

        XCTAssertEqual(client.phone, "809-555-1111")
    }
}

private final class ClientsURLProtocolStub: URLProtocol {
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
    static var clientsStubbed: URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [ClientsURLProtocolStub.self]
        return configuration
    }
}
