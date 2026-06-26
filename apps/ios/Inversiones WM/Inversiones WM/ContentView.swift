import SwiftUI

struct ContentView: View {
    private let apiBaseURL = URL(string: "http://192.168.1.4:3000/api/v1")!

    var body: some View {
        AppRootView(apiBaseURL: apiBaseURL)
    }
}

#Preview {
    ContentView()
}
