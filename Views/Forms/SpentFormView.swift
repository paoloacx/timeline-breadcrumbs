//
//  SpentFormView.swift
//  BreadcrumbsTimeline
//
//  Spent form (description + amount in euros)
//

import SwiftUI

struct SpentFormView: View {
    @EnvironmentObject var appState: AppState
    @Environment(\.dismiss) var dismiss

    @State private var timestamp = Date()
    @State private var spentDescription = ""
    @State private var amount = ""

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 16) {
                    // Date & Time
                    macField(label: "📅 Date & Time") {
                        DatePicker("", selection: $timestamp, displayedComponents: [.date, .hourAndMinute])
                            .labelsHidden()
                            .font(.custom("Courier", size: 14))
                    }

                    // Description
                    macField(label: "Description:") {
                        TextField("What did you buy?", text: $spentDescription)
                            .font(.custom("Courier", size: 14))
                            .padding(8)
                            .background(Color.white)
                            .overlay(
                                RoundedRectangle(cornerRadius: 0)
                                    .stroke(Color.black, lineWidth: 2)
                            )
                    }

                    // Amount
                    macField(label: "Amount:") {
                        HStack(spacing: 8) {
                            TextField("0.00", text: $amount)
                                .font(.custom("Courier", size: 14))
                                .keyboardType(.decimalPad)
                                .padding(8)
                                .background(Color.white)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 0)
                                        .stroke(Color.black, lineWidth: 2)
                                )

                            Text("€")
                                .font(.custom("Courier", size: 18))
                                .fontWeight(.bold)
                        }
                    }

                    // Delete button (when editing)
                    if appState.editingEntryId != nil {
                        Button(action: deleteEntry) {
                            HStack {
                                Image(systemName: "trash.fill")
                                Text("Delete")
                                    .font(.custom("Courier", size: 14))
                                    .fontWeight(.bold)
                            }
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.red)
                            .overlay(
                                RoundedRectangle(cornerRadius: 0)
                                    .stroke(Color.black, lineWidth: 3)
                            )
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(hex: "f0f0f0"))
            .navigationTitle(appState.editingEntryId == nil ? "New Expense" : "Edit Expense")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        appState.clearSpentState()
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        saveEntry()
                    }
                    .disabled(spentDescription.isEmpty || amount.isEmpty)
                }
            }
        }
        .onAppear {
            loadEditingEntry()
        }
    }

    private func macField<Content: View>(label: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(label)
                .font(.custom("Courier", size: 14))
                .fontWeight(.bold)
            content()
        }
    }

    private func loadEditingEntry() {
        guard let entryId = appState.editingEntryId,
              let entry = appState.entries.first(where: { $0.id == entryId }) else {
            return
        }

        timestamp = entry.timestamp
        spentDescription = entry.spentDescription ?? ""
        if let amt = entry.amount {
            amount = String(format: "%.2f", amt)
        }
    }

    private func saveEntry() {
        guard !spentDescription.isEmpty,
              let amountValue = Double(amount.replacingOccurrences(of: ",", with: ".")) else {
            return
        }

        let entry = Entry(
            id: appState.editingEntryId ?? Int64(Date().timeIntervalSince1970 * 1000),
            timestamp: timestamp,
            note: spentDescription,
            spentDescription: spentDescription,
            amount: amountValue,
            isTimedActivity: false,
            isQuickTrack: false,
            isSpent: true,
            isRecap: false,
            type: "spent"
        )

        if appState.editingEntryId != nil {
            appState.updateEntry(entry)
        } else {
            appState.addEntry(entry)
        }

        appState.clearSpentState()
        dismiss()
    }

    private func deleteEntry() {
        guard let entryId = appState.editingEntryId else { return }
        appState.removeEntry(id: entryId)
        appState.clearSpentState()
        dismiss()
    }
}
