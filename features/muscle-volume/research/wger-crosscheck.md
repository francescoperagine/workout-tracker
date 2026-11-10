# Controllo incrociato con wger (10 novembre 2026)

Fonte: fixture del repository wger-project/wger (`wger/exercises/fixtures`: exercise-base-data.json,
muscles.json, translations.json), licenza CC-BY-SA. Abbinamento per nome e alias dei 43 esercizi di
`src/data/catalog.ts` con i nomi wger. Abbinamenti esatti: 18 su 43.

Esito: wger **non** è una fonte affidabile, serve solo come controllo. Errori evidenti: lo squat con bilanciere non
ha i quadricipiti; la leg press ha i polpacci tra i principali e glutei e polpacci ripetuti tra i secondari; la back
extension ha dorsali e dentato anteriore; stacco rumeno con bilanciere e rematore seduto al cavo sono vuoti. wger ha
un solo muscolo «Shoulders», quindi non separa i deltoidi.

Muscoli wger: Biceps, Shoulders, Serratus anterior, Chest, Triceps, Abs, Calves, Glutes, Trapezius, Quads,
Hamstrings, Lats, Brachialis, Obliquus externus abdominis, Soleus, Lower back.

| id catalogo | esercizio wger | principali (P) e secondari (S) in wger |
| --- | --- | --- |
| squat-bilanciere | Barbell squat | P=['Hamstrings', 'Glutes'] S=['Obliquus externus abdominis', 'Abs'] |
| leg-press | Leg Press | P=['Hamstrings', 'Calves', 'Glutes', 'Quads'] S=['Calves', 'Glutes'] |
| squat-al-smith | Smith machine squat | P=['Glutes', 'Quads'] S=[] |
| goblet-squat | nessun abbinamento per nome | |
| panca-piana-bilanciere | Bench Press | P=['Chest'] S=['Shoulders', 'Triceps'] |
| chest-press | Chest Press | P=['Chest'] S=[] |
| panca-piana-manubri | Dumbbell Bench Press | P=['Chest'] S=['Shoulders', 'Triceps'] |
| rematore-manubri-petto-su-panca-inclinata | nessun abbinamento per nome | |
| rematore-al-cavo-basso | Pulley basso | P=['Lats'] S=['Biceps', 'Brachialis'] |
| row-machine-con-appoggio | nessun abbinamento per nome | |
| hip-thrust-bilanciere | Barbell Hip Thrust | P=['Glutes'] S=[] |
| hip-thrust-machine | nessun abbinamento per nome | |
| glute-bridge-con-manubrio | nessun abbinamento per nome | |
| pull-through-al-cavo | Cable pull through | P=['Glutes'] S=['Hamstrings', 'Calves', 'Quads', 'Soleus'] |
| distensioni-manubri-seduto-schienale-alto | nessun abbinamento per nome | |
| shoulder-press-machine | nessun abbinamento per nome | |
| curl-manubri-su-panca-inclinata | nessun abbinamento per nome | |
| curl-al-cavo-basso | nessun abbinamento per nome | |
| curl-ez | nessun abbinamento per nome | |
| alzate-laterali | Alzate Laterali | P=['Shoulders'] S=[] |
| alzate-al-cavo | nessun abbinamento per nome | |
| macchina-laterali | nessun abbinamento per nome | |
| standing-calf | nessun abbinamento per nome | |
| calf-alla-leg-press | nessun abbinamento per nome | |
| calf-monopodalico-con-manubrio | nessun abbinamento per nome | |
| stacco-rumeno-bilanciere | Romanian Deadlift | P=[] S=[] |
| stacco-rumeno-manubri | Dumbbell Romanian Deadlift | P=['Hamstrings', 'Glutes'] S=[] |
| hyperextension-45-con-disco | Back extensión | P=['Lats', 'Serratus anterior'] S=[] |
| distensioni-manubri-panca-inclinata | Incline Dumbbell Press | P=['Chest'] S=['Shoulders', 'Triceps'] |
| incline-chest-press | nessun abbinamento per nome | |
| panca-inclinata-al-smith | nessun abbinamento per nome | |
| lat-machine-presa-prona | nessun abbinamento per nome | |
| trazioni-assistite-o-negative | Assisted Pull-Up | P=['Lats', 'Trapezius'] S=['Shoulders', 'Biceps', 'Abs', 'Serratus anterior'] |
| lat-monobraccio-al-cavo | nessun abbinamento per nome | |
| leg-press-piedi-a-meta-pedana | nessun abbinamento per nome | |
| hack-squat | nessun abbinamento per nome | |
| leg-extension | Leg Extension | P=['Quads'] S=[] |
| rematore-seduto-al-cavo-basso | Seated Cable Row | P=[] S=[] |
| rematore-manubrio-monobraccio-con-appoggio | nessun abbinamento per nome | |
| row-machine | nessun abbinamento per nome | |
| french-press-ez | nessun abbinamento per nome | |
| pushdown-ai-cavi | Triceps Pushdown | P=['Triceps'] S=[] |
| french-press-con-manubrio | nessun abbinamento per nome | |
