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
    ptObj[v] = rxReportRow[indexTable[v]];
  });
  return ptObj;
};

/**
 * @param {PtObj} ptObj
 * @return {Promise<Patient|undefined>}
 */
const _findPatient = async (ptObj) => {
  try {
    if (!ptObj.patientID) {
      throw new Error();
    }
    return await PT.findOne({ patientID: ptObj.patientID });
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {PtObj} ptObj
 * @return {Promise<Patient|undefined>}
 */
const _createPatient = async (ptObj) => {
  try {
    return await PT.create(ptObj);
  } catch (e) {
    console.log(e);
  }
};

/**
 * @param {PtObj} ptObj
 * @param {Patient} pt
 * @return {Promise<Patient|undefined>}
 */
const _updatePatient = async (ptObj, pt) => {
  try {
    let change = false;
    const keys = Object.keys(ptObj);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (pt[key] !== ptObj[key]) {
        change = true;
        break;
      }
    }
    if (change) {
      return await PT.findByIdAndUpdate(pt._id, ptObj, { new: true });
    }
    return pt;
  } catch (e) {
    console.log(e);
  }
};

/**
 * Also Updates the document.
 * @param {PtObj} ptObj
 * @returns {Promise<Patient|undefined>}
 */
exports.upsertPatient = async (ptObj) => {
  try {
    const pt = await _findPatient(ptObj);
    if (!pt) {
      return await _createPatient(ptObj);
    }
    return await _updatePatient(ptObj, pt);
  } catch (e) {
    console.log(e);
  }
};
