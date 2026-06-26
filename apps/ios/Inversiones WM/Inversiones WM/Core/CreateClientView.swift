import SwiftUI

public struct CreateClientView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var firstName = ""
    @State private var lastName = ""
    @State private var phone = ""
    @State private var identification = ""
    @State private var isSaving = false

    private let title: String
    private let save: (CreateClientInput) async -> Bool

    public init(
        title: String = "Nuevo cliente",
        client: ClientDetail? = nil,
        save: @escaping (CreateClientInput) async -> Bool
    ) {
        self.title = title
        self.save = save
        _firstName = State(initialValue: client?.firstName ?? "")
        _lastName = State(initialValue: client?.lastName ?? "")
        _phone = State(initialValue: client?.phone ?? "")
        _identification = State(initialValue: client?.identification ?? "")
    }

    public var body: some View {
        NavigationStack {
            Form {
                Section("Datos") {
                    TextField("Nombre", text: $firstName)
                    TextField("Apellido", text: $lastName)
                    TextField("Telefono", text: $phone)
                    TextField("Cedula", text: $identification)
                }
            }
            .navigationTitle(title)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(isSaving ? "Guardando" : "Guardar") {
                        Task { await submit() }
                    }
                    .disabled(isSaving || !canSave)
                }
            }
        }
    }

    private var canSave: Bool {
        firstName.trimmingCharacters(in: .whitespacesAndNewlines).count >= 2 &&
            lastName.trimmingCharacters(in: .whitespacesAndNewlines).count >= 2
    }

    private func submit() async {
        isSaving = true
        defer { isSaving = false }

        let ok = await save(
            CreateClientInput(
                firstName: firstName.trimmingCharacters(in: .whitespacesAndNewlines),
                lastName: lastName.trimmingCharacters(in: .whitespacesAndNewlines),
                phone: optional(phone),
                identification: optional(identification)
            )
        )
        if ok {
            dismiss()
        }
    }

    private func optional(_ value: String) -> String? {
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
