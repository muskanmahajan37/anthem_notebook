log_prefix = '[anthem_notebook] '; //to debug extension
define([ 'jquery', 'base/js/namespace', 'base/js/events'],
    function ( $, Jupyter, JupyterEvents) {
        "use strict";

        // Function add sections by copying from the template.ipynb
        const add_sections = function () {
            const template_path = Jupyter.notebook.base_url + 'nbextensions/anthem_notebook/template.ipynb';
            $.getJSON(template_path, json => {
                let cells = json['cells'];
                cells.forEach((item, index) => {
                    Jupyter.notebook.insert_cell_at_index(item['cell_type'], index).set_text(item['source'].join(''));
                    Jupyter.notebook.get_cell(index).metadata = item.metadata;
                });
            });
        };

        //Function on initialize
        const initialize = function () {          
            if (Jupyter.notebook.ncells() === 1) {
                console.log(log_prefix + 'Configuration read: adding template cells');
                add_sections();
            }
        };


        
        const load_ipython_extension = function () {
            return Jupyter.notebook.config.loaded.then(initialize);
        };

        return {
            load_ipython_extension: load_ipython_extension
        };
    }
);
