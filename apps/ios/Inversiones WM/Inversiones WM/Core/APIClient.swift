import Foundation

public enum APIClient {
    public static func loginRequest(baseURL: URL, username: String, password: String) throws -> URLRequest {
        let url = baseURL.appending(path: "auth/login")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = Data(#"{"username":"\#(username)","password":"\#(password)"}"#.utf8)
        return request
    }

    public static func clientsRequest(
        baseURL: URL,
        accessToken: String,
        take: Int = 50,
        skip: Int = 0
    ) throws -> URLRequest {
        let url = baseURL
            .appending(path: "clients")
            .appending(queryItems: [
                URLQueryItem(name: "take", value: String(take)),
                URLQueryItem(name: "skip", value: String(skip)),
            ])
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    public static func createClientRequest(
        baseURL: URL,
        accessToken: String,
        input: CreateClientInput
    ) throws -> URLRequest {
        let url = baseURL.appending(path: "clients")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(input)
        return request
    }

    public static func clientDetailRequest(baseURL: URL, accessToken: String, id: Int) throws -> URLRequest {
        let url = baseURL.appending(path: "clients/\(id)")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    public static func loansRequest(
        baseURL: URL,
        accessToken: String,
        take: Int = 50,
        skip: Int = 0
    ) throws -> URLRequest {
        let url = baseURL
            .appending(path: "loans")
            .appending(queryItems: [
                URLQueryItem(name: "take", value: String(take)),
                URLQueryItem(name: "skip", value: String(skip)),
            ])
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    public static func createLoanRequest(
        baseURL: URL,
        accessToken: String,
        input: CreateLoanInput
    ) throws -> URLRequest {
        let url = baseURL.appending(path: "loans")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(input)
        return request
    }

    public static func loanDetailRequest(baseURL: URL, accessToken: String, id: String) throws -> URLRequest {
        let url = baseURL.appending(path: "loans/\(id)")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    public static func createPaymentRequest(
        baseURL: URL,
        accessToken: String,
        input: CreatePaymentInput
    ) throws -> URLRequest {
        let url = baseURL.appending(path: "payments")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(input)
        return request
    }

    public static func loanProductsRequest(baseURL: URL, accessToken: String) throws -> URLRequest {
        let url = baseURL.appending(path: "loan-products")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    public static func dashboardRequest(baseURL: URL, accessToken: String) throws -> URLRequest {
        let url = baseURL.appending(path: "reports/dashboard")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    public static func upcomingPaymentsRequest(baseURL: URL, accessToken: String) throws -> URLRequest {
        let url = baseURL.appending(path: "reports/payments/upcoming")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    public static func requestsRequest(baseURL: URL, accessToken: String) throws -> URLRequest {
        let url = baseURL.appending(path: "requests")
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    public static func createRequestRequest(
        baseURL: URL,
        accessToken: String,
        input: CreateRequestInput
    ) throws -> URLRequest {
        let url = baseURL.appending(path: "requests")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(input)
        return request
    }

    public static func approveRequestRequest(baseURL: URL, accessToken: String, id: String) throws -> URLRequest {
        let url = baseURL.appending(path: "requests/\(id)/approve")
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    public static func rejectRequestRequest(baseURL: URL, accessToken: String, id: String) throws -> URLRequest {
        let url = baseURL.appending(path: "requests/\(id)/reject")
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        return request
    }

    public static func updateClientRequest(
        baseURL: URL,
        accessToken: String,
        id: Int,
        input: CreateClientInput
    ) throws -> URLRequest {
        let url = baseURL.appending(path: "clients/\(id)")
        var request = URLRequest(url: url)
        request.httpMethod = "PATCH"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(input)
        return request
    }
}
