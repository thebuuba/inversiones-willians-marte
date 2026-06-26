import SwiftUI

public struct CreatePaymentView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var amount = ""
    @State private var date = Date()
    @State private var paymentMethod = "cash"
    @State private var reference = ""
    @State private var notes = ""
    @State private var isSaving = false
    @State private var errorMessage: String?

    private let save: (Double, String, String?, String?, String?) async -> Bool

    public init(save: @escaping (Double, String, String?, String?, String?) async -> Bool) {
        self.save = save
    }

    public var body: some View {
        NavigationStack {
            Form {
                Section("Pago") {
                    TextField("Monto", text: $amount)
                    DatePicker("Fecha", selection: $date, displayedComponents: .date)
                    TextField("Método", text: $paymentMethod)
                    TextField("Referencia", text: $reference)
                    TextField("Nota", text: $notes)
                }

                if let errorMessage {
                    Text(errorMessage)
                        .foregroundStyle(.red)
                }
            }
            .navigationTitle("Registrar pago")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Guardando..." : "Guardar") {
                        Task { await submit() }
                    }
                    .disabled(isSaving || parsedAmount == nil)
                }
            }
        }
    }

    private var parsedAmount: Double? {
        Double(amount.replacingOccurrences(of: ",", with: ".")).flatMap { $0 > 0 ? $0 : nil }
    }

    private func submit() async {
        guard let parsedAmount else { return }
        isSaving = true
        errorMessage = nil
        defer { isSaving = false }

        let ok = await save(
            parsedAmount,
            Self.formatter.string(from: date),
            emptyToNil(paymentMethod),
            emptyToNil(reference),
            emptyToNil(notes)
        )
        if ok {
            dismiss()
        } else {
            errorMessage = "No se pudo guardar"
        }
    }

    private func emptyToNil(_ value: String) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private static let formatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()
}
