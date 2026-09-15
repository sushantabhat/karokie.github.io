export const NOTES = [
  'C',  'Db', 'D',  'Eb',
  'E',  'F',  'Gb', 'G',
  'Ab', 'A',  'Bb', 'B'
];

export const SCALE_TYPES = [
  {
    name: 'Major',
    steps: [2, 2, 1, 2, 2, 2, 1]
  },
  {
    name: 'Minor',
    steps: [2, 1, 2, 2, 1, 2, 2]
  },
  {
    name: 'Major (pentatonic)',
    steps: [2, 2, 3, 2, 3]
  },
  {
    name: 'Minor (pentatonic)',
    steps: [3, 2, 2, 3, 2]
  },
];

const getNoteFrequency = (note, octave) => {
  return 440 * Math.pow(2, (NOTES.indexOf(note) + (octave - 4) * 12) / 12);
};

export const getScaleFreqs = (
  baseNote, 
  scaleName,
  minOctave=-8,
  maxOctave=8,
) => {
  let scaleSteps;
  for (const scaleType of SCALE_TYPES) {
    if (scaleType.name === scaleName) {
      scaleSteps = scaleType.steps;
    }
  }
  
  const scaleFreqs = [];
  const baseIndex = NOTES.indexOf(baseNote);
  
  for (let octave = minOctave; octave <= maxOctave; octave++) {
    let index = baseIndex;
    for (const step of scaleSteps) {
      // Calculate true semitone distance from C0 (where C0 is octave 0, index 0)
      const totalSemitones = (octave * 12) + index;
      
      // Convert back to note and correct octave
      const wrappedNote = NOTES[((totalSemitones % 12) + 12) % 12];
      const correctOctave = Math.floor(totalSemitones / 12);
      
      scaleFreqs.push(getNoteFrequency(wrappedNote, correctOctave));
      index += step;
    }
  }
  
  // Sort frequencies just in case
  scaleFreqs.sort((a, b) => a - b);
  
  return new Float32Array(scaleFreqs);
};