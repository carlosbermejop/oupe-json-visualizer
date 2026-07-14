import type { Exercise } from '../types/exercise'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-1 text-sm font-semibold text-gray-500 uppercase">{title}</h3>
      {children}
    </div>
  )
}

function TypeSpecificDetails({ exercise }: { exercise: Exercise }) {
  switch (exercise.type) {
    case 'MCHS':
      return (
        <Section title="Options">
          <ol className="list-decimal space-y-1 pl-5">
            {exercise.options.map((opt, i) => (
              <li key={i}>{opt}</li>
            ))}
          </ol>
        </Section>
      )
    case 'WROD':
      return (
        <Section title="Scrambled words">
          <ol className="list-decimal space-y-1 pl-5">
            {exercise.scrambled_words.map((words, i) => (
              <li key={i}>{words}</li>
            ))}
          </ol>
        </Section>
      )
    case 'MTCH':
      return (
        <Section title="Match options">
          <ul className="space-y-1">
            {Object.entries(exercise.match_options).map(([key, value]) => (
              <li key={key}>
                <span className="font-mono">{key}</span> — {value}
              </li>
            ))}
          </ul>
        </Section>
      )
    case 'FIBL':
      return exercise.word_bank && exercise.word_bank.length > 0 ? (
        <Section title="Word bank">
          <p>{exercise.word_bank.join(', ')}</p>
        </Section>
      ) : null
    default:
      return null
  }
}

export function QuestionDisplay({ exercise }: { exercise: Exercise }) {
  return (
    <div>
      <Section title="Type">
        <p>{exercise.type}</p>
      </Section>
      <Section title="Competence">
        <p>{exercise.competence.join(', ')}</p>
      </Section>
      <Section title="Question">
        <p>{exercise.question}</p>
      </Section>
      <Section title={exercise.type === 'ESSAY' ? 'Tasks' : 'Text with gaps'}>
        <ol className="list-decimal space-y-1 pl-5">
          {exercise.text_with_gaps.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ol>
      </Section>
      <TypeSpecificDetails exercise={exercise} />
      {exercise.solutions.length > 0 && (
        <Section title="Solutions">
          <ol className="list-decimal space-y-1 pl-5">
            {exercise.solutions.map((sol, i) => (
              <li key={i}>{sol}</li>
            ))}
          </ol>
        </Section>
      )}
      {exercise.assets.length > 0 && (
        <Section title="Assets">
          <ul className="list-disc space-y-1 pl-5">
            {exercise.assets.map((asset, i) => (
              <li key={i}>{asset}</li>
            ))}
          </ul>
        </Section>
      )}
      {exercise._source && (
        <Section title="Source">
          <p className="text-sm text-gray-500">
            {exercise._source.pdf}
            {exercise._source.page ? `, p. ${exercise._source.page}` : ''}
          </p>
        </Section>
      )}
    </div>
  )
}
