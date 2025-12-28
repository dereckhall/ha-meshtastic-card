import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'src/meshtastic-card.js',
  output: {
    file: 'dist/meshtastic-card.js',
    format: 'umd',
    name: 'Meshtastic',
  },
  plugins: [
    resolve(),
  ],
};
