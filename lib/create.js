var async = require('async');
var fp = require('annofp');
var is = require('annois');

var getValid = require('./utils/get_valid');
var operate = require('./utils/operate');


function create(model, data, cb) {
    if(is.array(data)) {
        return createMultiple(model, data, cb);
    }

    createOne(model, data, cb);
}
function createMultiple(model, data, cb) {
    async.map(data, createOne.bind(null, model), cb);
}
function createOne(model, data, cb) {
    var meta = model.meta;
    var metaNames = Object.keys(meta);
    var ok = metaNames.filter(function(name) {
        var field = meta[name];

        if(field.unique) {
            return fp.filter(function(d) {
                return data[name] === d[name];
            }, model._data).length === 0;
        }

        if(field.required && !(name in data)) {
            return false;
        }

        return true;
    }).length === fp.count(metaNames);

    if(ok) {
        var validData = getValid(meta, data);

        // https://github.com/sperelson/genid-for-nodejs
        if(!('id' in model)) {
            validData._id = new Date().getTime() - 1262304000000;
        }

        validData.created = new Date();

        model._data.push(validData);
        cb(null, validData);
    }
    else {
        // XXX: should use err instead + fix error msg
        cb(null, {error: 'name was not unique!'});
    }
}
module.exports = operate(create);