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

let getList = (base_version) => {
  return resolveSchema(base_version, 'List');
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
let code = args['code'];
let date = args['date'];
let empty_reason = args['empty-reason'];
let encounter = args['encounter'];
let identifier = args['identifier'];
let item = args['item'];
let notes = args['notes'];
let patient = args['patient'];
let source = args['source'];
let status = args['status'];
let subject = args['subject'];
let title = args['title'];

let query = {};
let ors = [];

if (_id) {
  query.id = _id;
}

return query;
};

let buildStu2SearchQuery = (args) => {
  // Common search params
  let { _content, _format, _id, _lastUpdated, _profile, _query, _security, _tag } = args;

// Search Result params
let { _INCLUDE, _REVINCLUDE, _SORT, _COUNT, _SUMMARY, _ELEMENTS, _CONTAINED, _CONTAINEDTYPED } =
  args;

// Resource Specific params
let code = args['code'];
let date = args['date'];
let empty_reason = args['empty-reason'];
let encounter = args['encounter'];
let identifier = args['identifier'];
let item = args['item'];
let notes = args['notes'];
let patient = args['patient'];
let source = args['source'];
let status = args['status'];
let subject = args['subject'];
let title = args['title'];

let query = {};
let ors = [];

if (_id) {
  query.id = _id;
}

return query;
};

/**
 *
 * @param {*} args
 * @param {*} context
 * @param {*} logger
 */
module.exports.search = (args) =>
  new Promise((resolve, reject) => {
    logger.info('List >>> search');

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
    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LIST}_${base_version}`);
    // TODO: Query database

    let List = getList(base_version);

    // Query our collection for this observation // TODO: Be sure this strategy is used by other services implemented
    collection.find(query).toArray().then(
      (lists) => {
        lists.forEach(function (element, i, returnArray) {
          returnArray[i] = new List(element);
        });
        resolve(lists);
      },
      err => {
        logger.error('Error with List.search: ', err);
        return reject(err);
      }
    )
  });

module.exports.searchById = (args) =>
  new Promise((resolve, reject) => {
    logger.info('List >>> searchById');

    let { base_version, id } = args;

    let List = getList(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LIST}_${base_version}`);
    // TODO: Query database
    collection.findOne({ id: id.toString() }, (err, list) => {
      if (err) {
        logger.error('Error with List.searchById: ', err);
        return reject(err);
      }
      if (list) {
        resolve(new List(list));
      }
      resolve();
    });
  });

module.exports.create = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('List >>> create');

    let resource = req.body;

    let { base_version } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LIST}_${base_version}`);

    let List = getList(base_version);
    let list = new List(resource);

    let id = getUuid(list);

    let Meta = getMeta(base_version);
    list.meta = new Meta({
      versionId: '1',
      lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
    });

    // TODO: save record to database
    let doc = JSON.parse(JSON.stringify(list.toJSON()));
    Object.assign(doc, { id: id });

    let history_doc = Object.assign({}, doc);
    Object.assign(doc, { _id: id });

    collection.insertOne(doc, (err) => {
      if (err) {
        logger.error('Error with List.create: ', err);
        return reject(err);
      }
      
      let history_collection = db.collection(`${COLLECTION.LIST}_${base_version}_History`);

      return history_collection.insertOne(history_doc, (err2) => {
        if (err2) {
          logger.error('Error with ListHistory.create: ', err2);
          return reject(err2);
        }
        // Return Id
        return resolve({ id: doc.id, resource_version: doc.meta.versionId });
      });
    });
  });

module.exports.update = (args, { req }) =>
  new Promise((resolve, reject) => {
    logger.info('List >>> update');

    let resource = req.body;

    let { base_version, id } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LIST}_${base_version}`);

    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with List.searchById: ', err);
        return reject(err);
      }

      // Cast resource to List Class
      let List = getList(base_version);
      let list = new List(resource);
      // TODO: set meta info, increment meta ID
      if (data && data.meta) {
        let foundList = new List(data);
        let meta = foundList.meta;
        meta.versionId = `${parseInt(foundList.meta.versionId) + 1}`;
        list.meta = meta;
      } else {
        let Meta = getMeta(base_version);
        list.meta = new Meta({
          versionId: '1',
          lastUpdated: moment.utc().format('YYYY-MM-DDTHH:mm:ssZ'),
        });
      }

      let cleaned = JSON.parse(JSON.stringify(list));
      let doc = Object.assign(cleaned, { _id: id });

      // TODO: save record to database
      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with List.update: ', err2);
          return reject(err2);
       }

        let history_collection = db.collection(`${COLLECTION.LIST}_${base_version}_History`);

        let history_list = Object.assign(cleaned, { id: id });
        // Return id, if recorded was created or updated, new meta version id
        return history_collection.insertOne(history_list, (err3) => {
          if (err3) {
            logger.error('Error with ListHistory.create: ', err3);
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
    logger.info('List >>> remove');

    let { base_version, id } = args;

    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LIST}_${base_version}`);
    // TODO: delete record in database (soft/hard)
    collection.deleteOne({ id: id }, (err, _) => {
      if (err) {
        logger.error('Error with List.remove');
        return reject({
          // Must be 405 (Method Not Allowed) or 409 (Conflict)
          // 405 if you do not want to allow the delete
          // 409 if you can't delete because of referential
          // integrity or some other reason
          code: 409,
          message: err.message,
        });
      }

      let history_collection = db.collection(`${COLLECTION.LIST}_${base_version}_History`);
      return history_collection.deleteMany({ id: id }, (err2) => {
        if (err2) {
          logger.error('Error with List.remove');
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
    logger.info('List >>> searchByVersionId');

    let { base_version, id, version_id } = args;

    let List = getList(base_version);

    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.LIST}_${base_version}_History`);
    // TODO: Query database
    history_collection.findOne(
      { id: id.toString(), 'meta.versionId': `${version_id}` },
      (err, list) => {
        if (err) {
          logger.error('Error with List.searchByVersionId: ', err);
          return reject(err);
        }

    // Cast result to List Class

    // Return resource class
        if (list) {
          resolve(new List(list));
        }

        resolve();
      }
    );
  });

module.exports.history = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('List >>> history');

    // Common search params
    let { base_version } = args;

    // Search Result params

    // Resource Specific params
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
    // TODO: Build query from Parameters
    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.LIST}_${base_version}_History`);
    // TODO: Query database

    let List = getList(base_version);

    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with List.history: ', err);
        return reject(err);
      }
    // Cast all results to List Class

    // Return Array
    data.toArray().then((lists) => {
      lists.forEach(function (element, i, returnArray) {
        returnArray[i] = new List(element);
      });
      resolve(lists);
    });
  });
});

module.exports.historyById = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('List >>> historyById');

    // Common search params
    let { base_version, id } = args;
    let query = {};

    // Search Result params
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
    query.id = `${id}`;

    let db = globals.get(CLIENT_DB);
    let history_collection = db.collection(`${COLLECTION.LIST}_${base_version}_History`);
    let List = getList(base_version);
    // TODO: Query database
    history_collection.find(query, (err, data) => {
      if (err) {
        logger.error('Error with List.historyById: ', err);
        return reject(err);
      }

    // Cast all results to List Class

    // Return Array
    data.toArray().then((lists) => {
      lists.forEach(function (element, i, returnArray) {
        returnArray[i] = new List(element);
      });
      resolve(lists);
    });
  });
});


module.exports.patch = (args, context) =>
  new Promise((resolve, reject) => {
    logger.info('List >>> patch'); // Should this say update (instead of patch) because the end result is that of an update, not a patch

    let { base_version, id, patchContent } = args;

    // Grab an instance of our DB and collection
    let db = globals.get(CLIENT_DB);
    let collection = db.collection(`${COLLECTION.LIST}_${base_version}`);

    // Get current record
    // Query our collection for this observation
    collection.findOne({ id: id.toString() }, (err, data) => {
      if (err) {
        logger.error('Error with List.searchById: ', err);
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

      let List = getList(base_version);
      let list = new List(resource);

      if (data && data.meta) {
        let foundList = new List(data);
        let meta = foundList.meta;
        meta.versionId = `${parseInt(foundList.meta.versionId) + 1}`;
        list.meta = meta;
      } else {
        return reject('Unable to patch resource. Missing either data or metadata.');
      }

      // Same as update from this point on
      let cleaned = JSON.parse(JSON.stringify(list));
      let doc = Object.assign(cleaned, { _id: id });

      // Insert/update our list record
      collection.findOneAndUpdate({ id: id }, { $set: doc }, { upsert: true }, (err2, res) => {
        if (err2) {
          logger.error('Error with List.update: ', err2);
          return reject(err2);
        }

        // Save to history
        let history_collection = db.collection(`${COLLECTION.LIST}_${base_version}_History`);
        let history_list = Object.assign(cleaned, { _id: id + cleaned.meta.versionId });

        // Insert our list record to history but don't assign _id
        return history_collection.insertOne(history_list, (err3) => {
          if (err3) {
            logger.error('Error with ListHistory.create: ', err3);
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