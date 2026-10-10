// Editor della lista esercizi/serie, usato in home (WorkoutEditor) e nella pagina del giorno.

import { escapeHtml, type Workout } from './bodytracker';

interface ExerciseListOptions {
  getWorkout: () => Workout;
  /** Chiamato dopo ogni modifica ai dati. */
  onChange: () => void;
  emptyText: string;
  /** Se presente, lo stato vuoto mostra un pulsante per aggiungere il primo esercizio. */
  onAddFirst?: () => void;
}

const DEFAULT_SET = { reps: 10, weight: 0 };

/** Chiede il nome e aggiunge un esercizio; restituisce false se l'utente annulla. */
export function promptNewExercise(workout: Workout): boolean {
  const name = prompt('Nome esercizio?')?.trim();
  if (!name) return false;
  workout.exercises.push({ name, sets: [{ ...DEFAULT_SET }] });
  return true;
}

export function mountExerciseList(list: HTMLElement, options: ExerciseListOptions): () => void {
  const { getWorkout, onChange, emptyText, onAddFirst } = options;

  function render() {
    const workout = getWorkout();
    list.innerHTML = '';

    if (workout.exercises.length === 0) {
      list.innerHTML = `
        <div class="text-center py-12 px-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <div class="text-6xl mb-4">💪</div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">Nessun esercizio ancora</h3>
          <p class="text-gray-500 mb-4">${escapeHtml(emptyText)}</p>
          ${
            onAddFirst
              ? `<button type="button" data-addfirst class="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition font-medium">
                  + Aggiungi il primo esercizio
                </button>`
              : ''
          }
        </div>
      `;
      return;
    }

    workout.exercises.forEach((ex, i) => {
      const exDiv = document.createElement('div');
      exDiv.className =
        'p-5 border-2 border-gray-200 rounded-xl bg-linear-to-br from-gray-50 to-white shadow-sm hover:shadow-md transition';

      const singleSet = ex.sets.length === 1;
      const setsHTML = ex.sets
        .map(
          (set, j) => `
          <div class="grid grid-cols-4 gap-2 mb-2">
            <div class="flex items-center justify-center font-medium text-gray-700">${j + 1}</div>
            <input type="number" class="rounded-lg border border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="${escapeHtml(set.reps)}" min="1" inputmode="numeric" aria-label="Ripetizioni serie ${j + 1}" data-reps="${i}-${j}" />
            <input type="number" class="rounded-lg border border-gray-300 text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value="${escapeHtml(set.weight)}" min="0" step="0.5" inputmode="decimal" aria-label="Peso serie ${j + 1} in kg" data-weight="${i}-${j}" />
            <button type="button" class="${singleSet ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'} transition text-sm" data-deleteset="${i}-${j}" aria-label="Rimuovi serie ${j + 1}" ${singleSet ? 'disabled' : ''}>
              ✕
            </button>
          </div>`
        )
        .join('');

      exDiv.innerHTML = `
        <div class="flex justify-between items-center mb-3">
          <h3 class="font-semibold text-lg text-gray-800">${escapeHtml(ex.name)}</h3>
          <div class="flex gap-2">
            <button type="button" class="text-sm text-blue-600 hover:text-blue-800 transition" data-addset="${i}">
              + Aggiungi serie
            </button>
            <button type="button" class="text-sm text-red-600 hover:text-red-800 transition" data-deleteex="${i}">
              🗑️ Elimina
            </button>
          </div>
        </div>
        <div class="grid grid-cols-4 gap-2 text-sm font-medium text-gray-600 mb-2">
          <div>Serie</div><div>Ripetizioni</div><div>Peso (kg)</div><div></div>
        </div>
        ${setsHTML}
      `;
      list.appendChild(exDiv);
    });
  }

  list.addEventListener('input', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    const workout = getWorkout();
    const repsAttr = target.dataset.reps;
    const weightAttr = target.dataset.weight;
    if (repsAttr) {
      const [i, j] = repsAttr.split('-').map(Number);
      workout.exercises[i].sets[j].reps = Number(target.value);
    } else if (weightAttr) {
      const [i, j] = weightAttr.split('-').map(Number);
      workout.exercises[i].sets[j].weight = Number(target.value);
    } else {
      return;
    }
    onChange();
  });

  list.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return;
    const button = e.target.closest('button');
    if (!button || button.disabled) return;
    const workout = getWorkout();

    if (button.hasAttribute('data-addfirst')) {
      onAddFirst?.();
      return;
    }

    const addset = button.dataset.addset;
    if (addset) {
      workout.exercises[Number(addset)].sets.push({ ...DEFAULT_SET });
      onChange();
      render();
      return;
    }

    const deleteset = button.dataset.deleteset;
    if (deleteset) {
      const [i, j] = deleteset.split('-').map(Number);
      if (workout.exercises[i].sets.length > 1 && confirm('Rimuovere questa serie?')) {
        workout.exercises[i].sets.splice(j, 1);
        onChange();
        render();
      }
      return;
    }

    const deleteex = button.dataset.deleteex;
    if (deleteex) {
      const i = Number(deleteex);
      if (confirm(`Eliminare l'esercizio "${workout.exercises[i].name}"?`)) {
        workout.exercises.splice(i, 1);
        onChange();
        render();
      }
    }
  });

  return render;
}
