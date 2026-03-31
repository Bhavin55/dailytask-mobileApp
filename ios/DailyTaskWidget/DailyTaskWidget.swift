import WidgetKit
import SwiftUI

// ---------------------------------------------------------------------------
// MARK: - Data model
// ---------------------------------------------------------------------------

struct WidgetTask: Identifiable, Codable {
    let id: String
    let title: String
    let completed: Bool
}

struct WidgetPayload: Codable {
    let tasks: [WidgetTask]
    let updatedAt: String?
}

// ---------------------------------------------------------------------------
// MARK: - Timeline provider
// ---------------------------------------------------------------------------

struct DailyTaskProvider: TimelineProvider {
    private let appGroup = "group.com.dailytask.mobileapp"
    private let storageKey = "dailytask_widget_data"

    func readTasks() -> [WidgetTask] {
        guard
            let defaults = UserDefaults(suiteName: appGroup),
            let raw = defaults.string(forKey: storageKey),
            let data = raw.data(using: .utf8),
            let payload = try? JSONDecoder().decode(WidgetPayload.self, from: data)
        else { return [] }
        return payload.tasks
    }

    func placeholder(in context: Context) -> DailyTaskEntry {
        DailyTaskEntry(date: Date(), tasks: [
            WidgetTask(id: "1", title: "Buy groceries", completed: false),
            WidgetTask(id: "2", title: "Reply to emails", completed: false),
            WidgetTask(id: "3", title: "Gym session", completed: true),
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (DailyTaskEntry) -> Void) {
        completion(DailyTaskEntry(date: Date(), tasks: readTasks()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<DailyTaskEntry>) -> Void) {
        let tasks = readTasks()
        let entry = DailyTaskEntry(date: Date(), tasks: tasks)

        // Refresh every 30 minutes so the widget stays current
        let next = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

// ---------------------------------------------------------------------------
// MARK: - Timeline entry
// ---------------------------------------------------------------------------

struct DailyTaskEntry: TimelineEntry {
    let date: Date
    let tasks: [WidgetTask]

    var pending: [WidgetTask] { tasks.filter { !$0.completed } }
    var done: [WidgetTask]    { tasks.filter {  $0.completed } }
}

// ---------------------------------------------------------------------------
// MARK: - Widget views
// ---------------------------------------------------------------------------

struct DailyTaskWidgetView: View {
    var entry: DailyTaskEntry
    @Environment(\.widgetFamily) var family

    // How many pending tasks to show per size
    var maxVisible: Int {
        switch family {
        case .systemSmall:  return 3
        case .systemMedium: return 4
        case .systemLarge:  return 9
        default:            return 3
        }
    }

    var todayString: String {
        let f = DateFormatter()
        f.dateFormat = "EEEE, MMM d"
        return f.string(from: Date())
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("DailyTask")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .foregroundColor(Color(red: 0.39, green: 0.40, blue: 0.95))
                    Text(todayString)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
                Spacer()
                if !entry.tasks.isEmpty {
                    Text("\(entry.pending.count)/\(entry.tasks.count)")
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.bottom, 8)

            Divider()
                .padding(.bottom, 8)

            // Task rows
            if entry.tasks.isEmpty {
                Spacer()
                HStack {
                    Spacer()
                    VStack(spacing: 4) {
                        Text("🎉")
                            .font(.title2)
                        Text("No tasks today")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    Spacer()
                }
                Spacer()
            } else {
                let visible = Array(entry.pending.prefix(maxVisible))
                ForEach(visible) { task in
                    TaskRow(task: task)
                        .padding(.bottom, 6)
                }

                let overflow = entry.pending.count - visible.count
                if overflow > 0 {
                    Text("+ \(overflow) more task\(overflow > 1 ? "s" : "")")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .padding(.top, 2)
                }

                if entry.pending.isEmpty {
                    Spacer()
                    HStack {
                        Spacer()
                        VStack(spacing: 4) {
                            Text("✅")
                                .font(.title2)
                            Text("All done!")
                                .font(.caption)
                                .fontWeight(.semibold)
                                .foregroundColor(Color.green)
                        }
                        Spacer()
                    }
                    Spacer()
                }
            }
        }
        .padding(14)
        .background(Color(UIColor.systemBackground))
    }
}

struct TaskRow: View {
    let task: WidgetTask
    private let indigo = Color(red: 0.39, green: 0.40, blue: 0.95)

    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .stroke(indigo, lineWidth: 1.5)
                .frame(width: 14, height: 14)
            Text(task.title)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundColor(.primary)
                .lineLimit(1)
        }
    }
}

// ---------------------------------------------------------------------------
// MARK: - Widget configuration
// ---------------------------------------------------------------------------

struct DailyTaskWidget: Widget {
    let kind = "DailyTaskWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DailyTaskProvider()) { entry in
            DailyTaskWidgetView(entry: entry)
        }
        .configurationDisplayName("Daily Tasks")
        .description("See your pending tasks for today at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// ---------------------------------------------------------------------------
// MARK: - Previews
// ---------------------------------------------------------------------------

struct DailyTaskWidget_Previews: PreviewProvider {
    static var previews: some View {
        let entry = DailyTaskEntry(date: Date(), tasks: [
            WidgetTask(id: "1", title: "Morning run", completed: false),
            WidgetTask(id: "2", title: "Read 30 pages", completed: false),
            WidgetTask(id: "3", title: "Team standup", completed: true),
            WidgetTask(id: "4", title: "Review PR", completed: false),
        ])
        DailyTaskWidgetView(entry: entry)
            .previewContext(WidgetPreviewContext(family: .systemSmall))
        DailyTaskWidgetView(entry: entry)
            .previewContext(WidgetPreviewContext(family: .systemMedium))
        DailyTaskWidgetView(entry: entry)
            .previewContext(WidgetPreviewContext(family: .systemLarge))
    }
}
