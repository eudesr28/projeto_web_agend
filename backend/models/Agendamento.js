const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Referência ao modelo User
      required: true},
    data: {type: Date, required: true },
    horario: {type: String, required: true },
  },
  {
    timestamps: true // Adiciona os campos createdAt e updatedAt automaticamente
  }
);

const Agendamento = mongoose.model('Agendamento', agendamentoSchema);

module.exports = Agendamento;
