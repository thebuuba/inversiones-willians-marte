import XCTest
@testable import InversionesIOS

final class IntegrationsSettingsServiceTests: XCTestCase {
    override func tearDown() {
        IntegrationsURLProtocolStub.handler = nil
        super.tearDown()
    }

    func testHealthReturnsBackendStatus() async throws {
        IntegrationsURLProtocolStub.handler = { request in
            XCTAssertEqual(request.url?.absoluteString, "http://localhost:3000/api/v1/health")

            let data = Data("""
            {
              "success": true,
              "data": {
                "status": "ok",
                "service": "backend"
              }
            }
            """.utf8)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: nil)!
            return (response, data)
        }

        let service = IntegrationsSettingsService(
            baseURL: URL(string: "http://localhost:3000/api/v1")!,
            session: URLSession(configuration: .integrationsStubbed)
        )

        let status = try await service.health()

        XCTAssertEqual(status.status, "ok")
        XCTAssertEqual(status.service, "backend")
    }
}

private final class IntegrationsURLProtocolStub: URLProtocol {
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
    static var integrationsStubbed: URLSessionConfiguration {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [IntegrationsURLProtocolStub.self]
        return configuration
    }
}
