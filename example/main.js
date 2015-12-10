/*jshint esnext: true */
/*jshint node: true */
/*jslint node: true */

'use strict';

var Exo = require("../src/exo.js");
// import {Model, View, Collection, Router, FetchFile} from '../src/exo.js';

function twoDigits(d) {
    if (0 <= d && d < 10) {
        return "0" + d.toString();
    }

    if (-10 < d && d < 0) {
        return "-0" + (-1 * d).toString();
    }

    return d.toString();
}

Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};

class Todo extends Exo.Model {
    get url() {
        return '/api/todo/';
    }
    get defaults() {
        return {
            name: '',
            description: '',
            created: '',
            completed: ''
        };
    }
}

class Todos extends Exo.Collection {
    get model() {
        return Todo;
    }
    get url() {
        return '/api/todo/';
    }
}

class TodoView extends Exo.View {
    constructor(options) {
        super(options);
        this.model.addListener('change', this.render.bind(this));
        this.template = Handlebars.compile(document.getElementById('todo_template').innerHTML);
    }
    save(event) {
        var d = new Date();
        var iso_datetime = d.toMysqlFormat();
        var completed_checkbox_element = this.element.querySelector('.todo_completed');
        var completed = (completed_checkbox_element && this.element.querySelector('.todo_completed').checked) ? iso_datetime : null;
        var data = {
            name: this.element.querySelector('.todo_name').value,
            description: this.element.querySelector('.todo_description').value,
            completed: completed
        };
        this.model.save(data, (response) => {
            console.log("Model Save: ", response);
        });
    }
    get events() {
        return {
            "click .todo_save": this.save.bind(this)
        }
    }
    render() {
        var rendered = this.template(this.model.serialize());
        this.element.innerHTML = rendered;
        return this;
    }
}

class TodosView extends Exo.View {
    constructor(options) {
        super(options);
        this.template = Handlebars.compile(document.getElementById('todos_template').innerHTML);
        this.collection.addListener('change', this.render.bind(this));
    }
    get events() {
        return {
            "change .completed_checkbox": this.todo_completed.bind(this),
            "click .edit_todo": this.edit_todo.bind(this),
            "click .delete_todo": this.delete_todo.bind(this),
            "click .create_button": this.create_todo.bind(this)
        };
    }
    create_todo() {
        var new_todo = new Todo();
        new_todo.addOneTimeListener('saved', () => {
            console.log("Add model to collection: ", new_todo);
            this.collection.add(new_todo);
        });
        var view = new TodoView({
            model: new_todo
        });
        var container = this.element.querySelector('#edit_todo_container');
        container.innerHTML = '';
        container.appendChild(view.element);
        view.render();
    }
    select_todo(id) {
        var model = this.collection.get(id);
        var view = new TodoView({
            model: model
        });
        var container = this.element.querySelector('#edit_todo_container');
        container.innerHTML = '';
        container.appendChild(view.element);
        view.render();
    }
    edit_todo(event) {
        var id = event.target.dataset.id;
        var model = this.collection.get(id);
        console.log("Edit TODO: ", id, model);
        var view = new TodoView({
            model: model
        });
        var container = this.element.querySelector('#edit_todo_container');
        container.innerHTML = '';
        container.appendChild(view.element);
        view.render();
    }
    delete_todo(event) {
        var id = event.target.dataset.id;
        var model = this.collection.get(id);
        model.delete();
        console.log("Delete TODO: ", id, model);
    }
    todo_completed(event) {
        var id = event.target.dataset.id;
        var model = this.collection.get(id);
        console.log("Complete TODO: ", id, model);
        var completed = null;
        if (model.completed === null) {
            var d = new Date();
            var iso_datetime = d.toMysqlFormat();
            completed = iso_datetime;
        }
        model.save({completed: completed}, () => {
            console.log("Completed Saved!");
        });
    }
    render() {
        console.log("Rendering TODOs");
        var render_data = {
            entries: this.collection.serialize()
        };
        this.element.innerHTML = this.template(render_data);
    }
}

class PageRouter extends Exo.Router {
    constructor() {
        super();
        console.log(document.getElementsByTagName('body')[0]);
        this.body_element = document.getElementsByTagName('body')[0];
        this.collection = new Todos();
        this.todos_view = new TodosView({
            collection: this.collection
        });

        this.collection_loaded = false;
        this.body_element.appendChild(this.todos_view.element);
        this.todos_view.render();
        this.collection.fetch(() => {
            this.collection_loaded = true;
            console.log(this.collection.serialize());
        });
    }
    get routes() {
        return {
            '/todo/:todo_id': this.show_todo.bind(this)
        }
    }
    show_todo(todo_id) {
        Exo.Ensure(() => {
            return this.collection_loaded;
        }).then(() => {
            console.log("Waited until it was done");
            this.todos_view.select_todo(todo_id);
        });
    }
}

document.addEventListener("DOMContentLoaded", function() {
    var router = new PageRouter();
    router.start();
});