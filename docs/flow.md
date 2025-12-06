Current Application Flow
graph TD
A[User Adds Goal] --> B[AI Generates Monthly Plan]
B --> C[User Reviews Plan]
C --> D{User Likes Plan?}
D -->|Yes| E[Apply Plan]
D -->|No| F[Regenerate/Modify]
E --> G[AI Classifies Items]
G --> H[Tasks/Habits/Recurring Tasks]
H --> I[Calendar Population]
I --> J[Weekly Summary]
J --> K[Improvement Plan]
K --> L[Calendar Modifications]
L --> M[Success Optimization]

    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style E fill:#fff3e0
    style G fill:#fce4ec
    style I fill:#f1f8e9
    style J fill:#e0f2f1
