const PrescriptionParser = {
  parse(text) {
    if (!text || text.trim() === '') {
      return null;
    }

    const lines = text.split('\n').map(line => line.trim()).filter(l => l);
    
    return {
      name: this.extractMedicationName(lines),
      dosage: this.extractDosage(lines),
      frequency: this.extractFrequency(lines),
      times: this.extractTimes(lines),
      instructions: this.extractInstructions(lines),
      doctor_name: this.extractDoctorName(lines)
    };
  },

  extractMedicationName(lines) {
    const first = lines[0] || '';
    return first.replace(/[0-9]+.*/, '').trim();
  },

  extractDosage(lines) {
    for (const line of lines) {
      if (line.match(/\d+\s*(mg|g|mcg|unit|IU)/i)) {
        return line;
      }
    }
    return '';
  },

  extractFrequency(lines) {
    for (const line of lines) {
      if (line.match(/(times?\s*a\s*day|daily|ngày|lần\s*một\s*ngày)/i)) {
        return line;
      }
    }
    return '';
  },

  extractTimes(lines) {
    const times = [];
    for (const line of lines) {
      const matches = line.match(/(\d{1,2}):(\d{2})/g);
      if (matches) {
        times.push(...matches);
      }
    }
    return [...new Set(times)];
  },

  extractInstructions(lines) {
    for (const line of lines) {
      if (line.match(/(with|food|water|meals|empty|stomach)/i)) {
        return line;
      }
    }
    return '';
  },

  extractDoctorName(lines) {
    for (const line of lines) {
      if (line.match(/Dr\.|doctor|bác sĩ/i)) {
        return line;
      }
    }
    return '';
  }
};

export default PrescriptionParser;
