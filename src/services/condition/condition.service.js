/*eslint no-unused-vars: "warn"*/

const { VERSIONS } = require('@asymmetrik/node-fhir-server-core').constants;
const { resolveSchema } = require('@asymmetrik/node-fhir-server-core');
const { COLLECTION, CLIENT_DB } = require('../../constants');
const moment = require('moment-timezone');
const FHIRServer = require('@asymmetrik/node-fhir-server-core');
const { ObjectID } = require('mongodb');
const logger = require('@asymmetrik/node-fhir-server-core').loggers.get();
const globals = require('../../globals');
const jsonpatch = require('fast-json-patch');

const { getUuid } = require('../../utils/uid.util');

const {
  stringQueryBuilder,
  tokenQueryBuilder,
  referenceQueryBuilder,
  addressQueryBuilder,
  nameQueryBuilder,
  dateQueryBuilder,
} = require('../../utils/querybuilder.util');

let getCondition = (base_version) => {
  return resolveSchema(base_version, 'Condition');
};

let getMeta = (base_version) => {
  return resolveSchema(base_version, 'Meta');
};

let buildStu3SearchQuery = (args) => {
    // Common search params
    let { base_version, _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } =
      args;

    // Search Result params
    let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } =
      args;
    
    // Resource Specific params
    let abatement_age = args['abatement-age'];
    let abatement_boolean = args['abatement-boolean'];
    let abatement_date = args['abatement-date'];
    let abatement_string = args['abatement-string'];
    let asserted_date = args['asserted-date'];
    let asserter = args['asserter'];
    let body_site = args['body-site'];
    let category = args['category'];
    let clinical_status = args['clinical-status'];
    let code = args['code'];
    let _context = args['_context'];
    let encounter = args['encounter'];
    let evidence = args['evidence'];
    let evidence_detail = args['evidence-detail'];
    let identifier = args['identifier'];
    let onset_age = args['onset-age'];
    let onset_date = args['onset-date'];
    let onset_info = args['onset-info'];
    let patient = args['patient'];
    let severity = args['severity'];
    let stage = args['stage'];
    let subject = args['subject'];
    let verification_status = args['verification-status'];

    let query = {};
    let ors = [];

    if (_id) {
      query.id = _id;
    }

    if (subject) {
      let queryBuilder = referenceQueryBuilder(subject, 'subject.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (encounter) {
      let queryBuilder = referenceQueryBuilder(encounter, 'encounter.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (asserter) {
      let queryBuilder = referenceQueryBuilder(asserter, 'asserter.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    if (evidence_detail) {
      let queryBuilder = referenceQueryBuilder(evidence_detail, 'evidence.detail.reference');
      for (let i in queryBuilder) {
        query[i] = queryBuilder[i];
      }
    }

    return query;
}

let buildStu2SearchQuery = (args) => {
  // Common search params
  let { _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

  // Search Result params
  let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } =
    args;
  
  // Resource Specific params
  let abatement_age = args['abatement-age'];
  let abatement_boolean = args['abatement-boolean'];
  let abatement_date = args['abatement-date'];
  let abatement_string = args['abatement-string'];
  let asserted_date = args['asserted-date'];
  let asserter = args['asserter'];
  let body_site = args['body-site'];
  let category = args['category'];
  let clinical_status = args['clinical-status'];
  let code = args['code'];
  let _context = args['_context'];
  let encounter = args['encounter'];
  let evidence = args['evidence'];
  let evidence_detail = args['evidence-detail'];
  let identifier = args['identifier'];
  let onset_age = args['onset-age'];
  let onset_date = args['onset-date'];
  let onset_info = args['onset-info'];
  let patient = args['patient'];
  let severity = args['severity'];
  let stage = args['stage'];
  let subject = args['subject'];
  let verification_status = args['verification-status'];

  let query = {};
  let ors = [];

  if (_id) {
    query.id = _id;
  }

  if (subject) {
    let queryBuilder = referenceQueryBuilder(subject, 'subject.reference');
    for (let i in queryBuilder) {
      query[i] = queryBuilder[i];
    }
  }

  if (encounter) {
    let queryBuilder = referenceQueryBuilder(encounter, 'encounter.reference');
    for (let i in queryBuilder) {
      query[i] = queryBuilder[i];
    }
  }

  if (asserter) {
    let queryBuilder = referenceQueryBuilder(asserter, 'asserter.reference');
    for (let i in queryBuilder) {
      query[i] = queryBuilder[i];
    }
  }

  if (evidence_detail) {
    let queryBuilder = referenceQueryBuilder(evidence_detail, 'evidence.detail.reference');
    for (let i in queryBuilder) {
      query[i] = queryBuilder[i];
    }
  }

  return query;
}

/**
 *
 * @param {*} args
 * @param {*} context
 * @param {*} logger
 */
module.exports.search = (args) =>
  new Promise((resolve, reject) => {
    logger.info('Condition >>> search');

    // TODO: Build query from Parameters
    let { base_version } = args;
    let query = {};

    switch (base_version) {
      case VERSIONS['1_0_2']:
        query = buildDstu2SearchQuery(args);
        break;
      case VERSIONS['3_0_1']:
      case VERSIONS['4_0_0']:
      case VERSIONS['4_0_1']:
        query = buildStu3SearchQuery(args);
        break;
    }

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.CONDITION}_${base_version}`);
    // TODO: Query database

    let Condition = getCondition(base_version);

    collection.find(query).toArray().then(
      (conditions) => {
        conditions.forEach(function (element, i, returnArray) {
          returnArray[i] = new Condition(element);
        });
        resolve(conditions);
      },
      err => {
        logger.error('Error with Condition.search: ', err);
        return reject(err);
      }
    )
  });

module.exports.searchById = (args) =>
  new Promise((resolve, reject) => {
    logger.info('Condition >>> searchById');

    let { base_version, id } = args;

    let Condition = getCondition(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.CONDITION}_${base_version}`);
    // TODO: Query database
    collection.findOne({ id: id.toString() }, (err, condition) => {
      if (err) {
        logger.error('Error with Condition.searchById: ', err);
        return reject(err);
      }
      if (condition) {
        resolve(new Condition(condition));
      }
      resolve();
    });
  });

module.exports.create = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('Condition >>> create');

    let resource = req.body;

    let { base_version } = args;

    // Grab an instance of our DB and collection (by version)
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.CONDITION}_${base_version}`);

    // Get current record
    let Condition = getCondition(base_version);
    let condition = new Condition(resource);

    // If no resource ID was provided, generate one.
    let id = getUuid(condition);

    // Cast resource to Condition Class

    // TODO: set meta info
    let Meta = getMeta(base_version);
    condition.meta = new Meta({
      versionId: '1',
      lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
    });
    // TODO: save record to database
    let doc = JSON.parse(JSON.stringify(condition.toJSON()));
    Object.assign(doc, { id: id });

    let history_doc = Object.assign({}, doc);
    Object.assign(doc, { _id: id });

    // Insert our condition record
    collection.insertOne(doc, (err) => {
      if (err) {
        logger.error('Error with Condition.create: ', err);
        return reject(err);
      }

      // Save the resource to history
      let history_collection = db.collection(`${COLLECTION.CONDITION}_${base_version}_History`);

      // Insert our condition record to history but don't assign _id
      return history_collection.insertOne(history_doc, (err2) => {
        if (err2) {
          logger.error('Error with ConditionHistory.create: ', err2);
          return reject(err2);
        }
        return resolve({ id: doc.id, resource_version: doc.meta.versionId });
      });
    });
  });

module.exports.update = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('Condition >>> update');

    let resource = req.body;

    let { base_version, id } = args;

    // Cast resource to Condition Class

    // TODO: set meta info, increment meta ID

    // TODO: save record to database
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.CONDITION}_${base_version}`);

    // Return id, if recorded was created or updated, new meta version id
    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with Condition.searchById: ', err);
        return reject(err);
      }

      let Condition = getCondition(base_version);
      let condition = new Condition(resource);

      if (data && data.meta) {
        let foundCondition = new Condition(data);
        let meta = foundCondition.meta;
        meta.versionId = `${parseInt(foundCondition.meta.versionId) + 1}`;
        condition.meta = meta;
      } else {
        let Meta = getMeta(base_version);
        condition.meta = new Meta({
          versionId: '1',
          lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
        });
      }

      let cleaned = JSON.parse(JSON.stringify(condition));
      let doc = Object.assign(cleaned, { _id: id });

      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with Condition.update: ', err2);
          return reject(err2);
        }

        // save to history
        let history_collection = db.collection(`${COLLECTION.CONDITION}_${base_version}_History`);

        let history_condition = Object.assign(cleaned, { id: id });

        // Insert our condition record to history but don't assign _id
        return history_collection.insertOne(history_condition, (err3) => {
          if (err3) {
            logger.error('Error with ConditionHistory.create: ', err3);
            return reject(err3);
          }

          return resolve({
            id: id,
            created: res.lastErrorObject && !res.lastErrorObject.updatedExisting,
            resource_version: doc.meta.versionId,
          });
        });
      });
    });
  });


module.exports.remove = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Condition >>> remove');

    let { base_version, id } = args;

    // TODO: delete record in database (soft/hard)
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.CONDITION}_${base_version}`);

    collection.deleteOne({ id: id }, (err, _) => {
      if (err) {
        logger.error('Error with Condition.remove');
        return reject({
          // Must be 405 (Method Not Allowed) or 409 (Conflict)
          // 405 if you do not want to allow the delete
          // 409 if you can't delete because of referential
          // integrity or some other reason
          code: 409,
          message: err.message,
        });
      }
      
      // delete history as well.  You can chose to save history.  Up to you
      let history_collection = db.collection(`${COLLECTION.CONDITION}_${base_version}_History`);
      return history_collection.deleteMany({ id: id }, (err2) => {
        if (err2) {
          logger.error('Error with Condition.remove');
          return reject({
            // Must be 405 (Method Not Allowed) or 409 (Conflict)
            // 405 if you do not want to allow the delete
            // 409 if you can't delete because of referential
            // integrity or some other reason
            code: 409,
            message: err2.message,
          });
        }

        // Return number of records deleted
        return resolve({ deleted: _.result && _.result.n });
      });
    });
   });

module.exports.searchByVersionId = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Condition >>> searchByVersionId');

    let { base_version, id, version_id } = args;

    let Condition = getCondition(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.CONDITION}_${base_version}_History`);
    // TODO: Query database
    history_collection.findOne(
      { id: id.toString(), 'meta.versionId': `${version_id}` },
      (err, condition) => {
        if (err) {
          logger.error('Error with Condition.searchByVersionId: ', err);
          return reject(err);
        }

    // Cast result to Condition Class

    // Return resource class
    if (condition) {
      resolve(new Condition(condition));
    }
    resolve();
  }
);
});

module.exports.history = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Condition >>> history');

    // Common search params
    let { base_version } = args;

    // Search Result params
    let query = {};

    switch (base_version) {
      case VERSIONS['1_0_2']:
        query = buildDstu2SearchQuery(args);
        break;
      case VERSIONS['3_0_1']:
      case VERSIONS['4_0_0']:
      case VERSIONS['4_0_1']:
        query = buildStu3SearchQuery(args);
        break;
    }

    // Resource Specific params

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.CONDITION}_${base_version}_History`);
    // TODO: Query database

    let Condition = getCondition(base_version);

    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with Condition.history: ', err);
        return reject(err);
      }
    
    // Cast all results to Condition Class
    data.toArray().then((conditions) => {
      conditions.forEach(function (element, i, returnArray) {
        returnArray[i] = new Condition(element);
      });

    // Return Array
      resolve(conditions);
    });
  });
});

module.exports.historyById = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Condition >>> historyById');

    // Common search params
    let { base_version, id } = args;

    // Search Result params


    // Resource Specific params

    // TODO: Build query from Parameters
    let query = {};

    switch (base_version) {
      case VERSIONS['1_0_2']:
        query = buildDstu2SearchQuery(args);
        break;
      case VERSIONS['3_0_1']:
      case VERSIONS['4_0_0']:
      case VERSIONS['4_0_1']:
        query = buildStu3SearchQuery(args);
        break;
    }
    
    query.id = `${id}`;

    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.CONDITION}_${base_version}_History`);

    // TODO: Query database

    let Condition = getCondition(base_version);

    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with Condition.historyById: ', err);
        return reject(err);
      }
    // Cast all results to Condition Class
    data.toArray().then((conditions) => {
      conditions.forEach(function (element, i, returnArray) {
        returnArray[i] = new Condition(element);
      });

      // Return Array
      resolve(conditions);
    });
  });
});

module.exports.patch = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('Condition >>> patch'); // Should this say update (instead of patch) because the end result is that of an update, not a patch

    let { base_version, id, patchContent } = args;

    // Grab an instance of our DB and collection
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.CONDITION}_${base_version}`);

    // Get current record
    // Query our collection for this observation
    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with Condition.searchById: ', err);
        return reject(err);
      }

      // Validate the patch
      let errors = jsonpatch.validate(patchContent, data);
      if (errors && Object.keys(errors).length > 0) {
        logger.error('Error with patch contents');
        return reject(errors);
      }
      // Make the changes indicated in the patch
      let resource = jsonpatch.applyPatch(data, patchContent).newDocument;

      let Condition = getCondition(base_version);
      let condition = new Condition(resource);

      if (data && data.meta) {
        let foundCondition = new Condition(data);
        let meta = foundCondition.meta;
        meta.versionId = `${parseInt(foundCondition.meta.versionId) + 1}`;
        condition.meta = meta;
      } else {
        return reject('Unable to patch resource. Missing either data or metadata.');
      }

      // Same as update from this point on
      let cleaned = JSON.parse(JSON.stringify(condition));
      let doc = Object.assign(cleaned, { _id: id });

      // Insert/update our condition record
      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with Condition.update: ', err2);
          return reject(err2);
        }

        // Save to history
        let history_collection = db.collection(`${COLLECTION.CONDITION}_${base_version}_History`);
        let history_condition = Object.assign(cleaned, { _id: id + cleaned.meta.versionId });

        // Insert our condition record to history but don't assign _id
        return history_collection.insertOne(history_condition, (err3) => {
          if (err3) {
            logger.error('Error with ConditionHistory.create: ', err3);
            return reject(err3);
          }

          return resolve({
            id: doc.id,
            created: res.lastErrorObject && !res.lastErrorObject.updatedExisting,
            resource_version: doc.meta.versionId,
          });
        });
      });
    });
  });