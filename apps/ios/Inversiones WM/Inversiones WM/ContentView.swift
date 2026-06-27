import SwiftUI

struct ContentView: View {
    var body: some View {
        AppRootView(apiBaseURL: AppEnvironment.apiBaseURL)
    }
}

#Preview {
    ContentView()
}
