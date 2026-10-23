# PickUp User Testing Protocol & Evidence Guide (Phase 7)

This document specifies the research protocol, consent script, measurement methodology, and honest reporting framework for the hidden `?study=1` evaluation mode in **PickUp**.

---

## 1. Study Overview & Goals

- **Objective**: Measure whether capturing mental state before an interruption using PickUp reduces **resumption latency** (time to resume work) and **subjective cognitive disorientation** (feeling lost) compared to an unassisted baseline.
- **Target Participants**: 3 to 5 knowledge workers or students, specifically welcoming those with ADHD, executive function challenges, or frequent workplace interruptions.
- **Study Design**: Counterbalanced within-subjects design ($A/B$ or $B/A$ ordering) comparing:
  1. **Condition A (Control)**: Interruption without PickUp.
  2. **Condition B (Intervention)**: Interruption with PickUp.

---

## 2. Informed Consent Script

Read this script aloud to each participant before beginning the session.

> **Researcher Script:**
>
> *"Thank you for helping us test PickUp today. We are evaluating a simple bookmarking tool designed to make it easier to resume work after unexpected interruptions.*
>
> *Here is how this session works:*
> - *Your participation is completely voluntary. You may stop, pause, or withdraw at any point without explanation.*
> - *We do not collect your name, email, or any personal identifying information. You will only be identified by an anonymous code (like P01).*
> - *All data recorded during this session is stored strictly on this local device. Zero data is sent to any external server or cloud service.*
> - *We will ask you to work on a brief writing task, introduce a short 3-minute interruption, and time how long it takes to resume your work.*
>
> *Do you have any questions? Do you agree to participate?"*

*(Obtain verbal affirmative consent before proceeding).*

---

## 3. Step-by-Step Testing Protocol (3–5 Participants)

### Preparation
1. Open the testing machine in Google Chrome with the app running:
   ```
   http://localhost:5173/?study=1
   ```
2. Verify the **Study Mode** tab is accessible in the header.
3. Assign the participant an anonymous code: `P01`, `P02`, `P03`, `P04`, or `P05`.
4. Counterbalance the order:
   - **P01 & P03**: Condition A (Without PickUp) $\rightarrow$ Condition B (With PickUp).
   - **P02 & P04 & P05**: Condition B (With PickUp) $\rightarrow$ Condition A (Without PickUp).

---

### Procedure

#### Phase 1: Primary Task Setup (5 minutes)
- Hand the participant a standardized knowledge task (e.g., drafting a summary email of an article or planning a mock project itinerary in a simple text editor).
- Ask the participant to work naturally for 3–5 minutes.

#### Phase 2: The Interruption Stimulus (3 minutes)
- **If Condition B (With PickUp)**:
  - Give the prompt: *"You have an urgent 3-minute interruption. Take up to 10 seconds to park your mental state in PickUp, then switch over."*
  - The participant types or speaks into PickUp, clicks **Park It**, verifies cues on the Review Screen, and clicks **Save Card**.
- **If Condition A (Without PickUp / Control)**:
  - Give the prompt: *"You have an urgent 3-minute interruption. Please immediately step away from this task."*
- **The Distraction**: Hand the participant an unrelated cognitive task (e.g. a 3-minute trivia quiz or asking them to categorize receipts on a separate tablet/screen) to clear active working memory.

#### Phase 3: Task Resumption & Timing
- After exactly 3 minutes, instruct the participant: *"The interruption is over. Please resume your original work task."*
- **Researcher Action**:
  1. Click **Start Timing** on the researcher stopwatch in `?study=1`.
  2. If in Condition B, participant glances at their parked PickUp card (*Where I was*, *Next 5-minute action*, *Waiting on*) or starts the 2-minute warm-up timer.
  3. The moment the participant makes their **first meaningful productive action** on the primary task (e.g. typing the next sentence or editing content in their document), click **Pause Timing**.
  4. Note: Idle browsing, re-reading old paragraphs, or switching tabs does **not** stop the timer; only productive forward action stops it.

#### Phase 4: Subjective Rating & Logging
- Ask the participant: *"On a scale of 1 to 5, how lost or disoriented did you feel when returning to your task?"*
  - `1`: Not at all lost (instantly resumed)
  - `2`: Slight hesitation
  - `3`: Moderately lost
  - `4`: Significant confusion
  - `5`: Completely lost (had to restart thinking from scratch)
- Enter the Participant Code, Condition, Resume Time, Rating, and any qualitative notes into the `?study=1` form.
- Click **Save Trial Record**.

---

## 4. What to Measure

| Metric | Type | Unit / Scale | Collection Method | Why It Matters |
| :--- | :--- | :--- | :--- | :--- |
| **Resumption Latency** | Quantitative | Seconds ($s$) | Researcher stopwatch | Measures behavioral task initiation delay and hesitation. |
| **Cognitive Disorientation** | Subjective | 1 to 5 Likert | Participant self-report | Captures working memory loss and cognitive friction. |
| **Resumption Anxiety / Notes** | Qualitative | Text observations | Researcher notes | Captures specific stumbling blocks (e.g. "opened 4 wrong tabs", "re-read previous page twice"). |

---

## 5. How to Report Results Honestly

To maintain scientific integrity and transparent hackathon documentation:

1. **State the Exact Sample Size ($n$)**:
   - Always state the number of participants (e.g., *"In an initial pilot test with $n = 4$ participants..."*).
   - Never report misleading percentages without raw denominators (e.g., write *"3 of 4 participants (75%)"*, never just *"75% of users experienced..."*).

2. **Explicitly Disclose Limitations**:
   - **Small Sample Size**: A 3–5 participant study is a formative usability pilot, not a statistically powered randomized controlled trial (RCT).
   - **Observer Bias**: The study was administered by project authors rather than blinded third-party observers.
   - **Simulated Environment**: Interruption was an artificial 3-minute distraction task rather than natural workplace chaos.
   - **Self-Selection**: Participants were voluntary students and knowledge workers, which may not represent all workplace demographics.

3. **Zero Therapeutic or Medical Claims**:
   - PickUp is an assistive cognitive workflow tool.
   - Do **not** claim PickUp *"cures ADHD paralysis"*, *"treats executive dysfunction"*, or *"replaces behavioral therapy"*.
   - Use measured, factual language: *"In our 4-participant pilot test, participants resumed their tasks an average of $X$ seconds faster when provided with a 10-second mental bookmark."*

4. **Preserve Raw Data**:
   - Use the **Export CSV** button in `?study=1` to save `pickup_study_results.csv`.
   - Keep the raw data accessible for peer review.
