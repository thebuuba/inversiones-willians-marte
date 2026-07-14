import SwiftUI

public enum InversionesIOS {}

enum AppEnvironment {
    static let apiBaseURL = URL(
        string: "https://inversiones-willians-marte-api-staging.natanaelpena1202.workers.dev/api/v1"
    )!
}

extension Color {
    static let appBackground = Color(red: 1, green: 1, blue: 1)
    static let appSurface = Color(red: 1, green: 1, blue: 1)
    static let appSurfaceSoft = Color(red: 0.96, green: 0.98, blue: 0.97)
    static let appBorder = Color(red: 0.87, green: 0.92, blue: 0.89)
    static let appGreen = Color(red: 0.18, green: 0.46, blue: 0.33)
    static let appGreenSoft = Color(red: 0.91, green: 0.96, blue: 0.93)
    static let appGold = Color(red: 0.48, green: 0.35, blue: 0.04)
    static let appGoldSoft = Color(red: 1, green: 0.95, blue: 0.78)
    static let appRust = Color(red: 0.62, green: 0.25, blue: 0.15)
    static let appRustSoft = Color(red: 0.99, green: 0.89, blue: 0.83)
    static let appBlue = Color(red: 0.11, green: 0.30, blue: 0.85)
    static let appBlueSoft = Color(red: 0.86, green: 0.92, blue: 1)
    static let appText = Color(red: 0.09, green: 0.24, blue: 0.17)
    static let appMuted = Color(red: 0.36, green: 0.43, blue: 0.39)
}

extension View {
    func appCard(cornerRadius: CGFloat = 22) -> some View {
        background(Color.appSurface)
            .clipShape(RoundedRectangle(cornerRadius: cornerRadius))
            .overlay {
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(Color.appBorder, lineWidth: 1)
            }
            .shadow(color: Color.appText.opacity(0.06), radius: 16, y: 8)
    }
}

struct PanelHero: View {
    let title: String
    let subtitle: String
    let symbol: String

    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            Image(systemName: symbol)
                .font(.title2)
                .foregroundStyle(Color.appGreen)
                .frame(width: 54, height: 54)
                .background(Color.appGreenSoft)
                .clipShape(Circle())

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.appText)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(Color.appMuted)
                    .lineLimit(2)
            }
            Spacer()
        }
        .padding(.vertical, 4)
    }
}

struct EmptyStateCard: View {
    let symbol: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: symbol)
                .font(.title2)
                .foregroundStyle(Color.appGreen)
                .frame(width: 54, height: 54)
                .background(Color.appGreenSoft)
                .clipShape(Circle())
            Text(title)
                .font(.headline)
                .foregroundStyle(Color.appText)
            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(Color.appMuted)
                .multilineTextAlignment(.center)
        }
        .padding(22)
        .frame(maxWidth: .infinity)
        .appCard()
    }
}

public struct CreateRequestInput: Encodable, Equatable, Sendable {
    public let firstName: String
    public let lastName: String
    public let identification: String?
    public let phone: String?
    public let amount: Double
    public let description: String?
    public let reference: String?

    public init(
        firstName: String,
        lastName: String,
        identification: String? = nil,
        phone: String? = nil,
        amount: Double,
        description: String? = nil,
        reference: String? = nil
    ) {
        self.firstName = firstName
        self.lastName = lastName
        self.identification = identification
        self.phone = phone
        self.amount = amount
        self.description = description
        self.reference = reference
    }
}

public struct LoanRequestItem: Decodable, Equatable, Identifiable {
    public let id: String
    public let code: String
    public let firstName: String
    public let lastName: String
    public let identification: String?
    public let phone: String?
    public let amount: Double
    public let description: String?
    public let reference: String?
    public let status: String
    public let createdAt: String

    public var fullName: String {
        "\(firstName) \(lastName)"
    }
}

public struct RequestsService: Sendable {
    private let baseURL: URL
    private let session: URLSession

    public init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }

    public func list(accessToken: String) async throws -> [LoanRequestItem] {
        let request = try APIClient.requestsRequest(baseURL: baseURL, accessToken: accessToken)
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<[LoanRequestItem]>.self, from: data)
        return wrapped.data ?? []
    }

    public func create(accessToken: String, input: CreateRequestInput) async throws -> LoanRequestItem {
        let request = try APIClient.createRequestRequest(baseURL: baseURL, accessToken: accessToken, input: input)
        return try await sendRequestMutation(request)
    }

    public func approve(accessToken: String, id: String) async throws -> LoanRequestItem {
        let request = try APIClient.approveRequestRequest(baseURL: baseURL, accessToken: accessToken, id: id)
        return try await sendRequestMutation(request)
    }

    public func reject(accessToken: String, id: String) async throws -> LoanRequestItem {
        let request = try APIClient.rejectRequestRequest(baseURL: baseURL, accessToken: accessToken, id: id)
        return try await sendRequestMutation(request)
    }

    private func sendRequestMutation(_ request: URLRequest) async throws -> LoanRequestItem {
        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, 200..<300 ~= httpResponse.statusCode else {
            throw URLError(.badServerResponse)
        }

        let wrapped = try JSONDecoder.inversiones.decode(APIResponse<LoanRequestItem>.self, from: data)
        guard let item = wrapped.data else {
            throw URLError(.cannotParseResponse)
        }
        return item
    }
}
