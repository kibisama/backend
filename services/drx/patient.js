const PT = require("../../schemas/dRx/patient");

/**
 * @typedef {PT.Patient} Patient
 * @typedef {typeof PT.schema.obj} PtObj
 */

/**
 * @param {[string]} csvHeader
 * @returns {Object<string, number>}
 */
exports.mapIndex = (csvHeader) => {
  const table = {};
  csvHeader.forEach((v, i) => {
    table[v] = i;
  });
  return {
    patientID: table.PatientID,
    patientFirstName: table.PatientFirstName,
    patientLastName: table.PatientLastName,
    patientDOB: table.PatientDOB,
    patientSex: table.PatientSex,
    patientStreet: table.PatientStreet,
    patientCity: table.PatientCity,
    patientState: table.PatientState,
    patientZip: table.PatientZip,
    patientPhone: table.patientPhone,
    patientSSN: table.PaientSSN,
    patNotes: table.PatNotes,
  };
};

/**
 * @param {ReturnType<mapIndex>} indexTable
 * @param {[string]} rxReportRow
 * @returns {PtObj}
 */
exports.createPtObj = (indexTable, rxReportRow) => {
  const ptObj = {};
  Object.keys(indexTable).forEach((v) => {
    ptObj[v] = rxReportRow[indexTable[v]].trim();
  });
  return ptObj;
};

/**
 * Also Updates the document.
 * @param {PtObj} ptObj
 * @returns {Promise<Patient|undefined>}
 */
exports.upsertPatient = async (ptObj) => {
  try {
    const patientID = ptObj.patientID;
    if (!patientID) {
      throw new Error();
    }
    return await PT.findOneAndUpdate(
      { patientID },
      { $set: ptObj },
      { new: true, upsert: true }
    );
  } catch (e) {
    console.error(e);
  }
};
