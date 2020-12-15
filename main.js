log_prefix = '[anthem_notebook] '; //to debug extension
define([ 'jquery', 'base/js/namespace', 'base/js/events'],
    function ( $, Jupyter, JupyterEvents) {
        "use strict";// why strict https://www.w3schools.com/js/js_strict.asp

        // Function add sections by copying cells from the template.ipynb
        const add_sections = function () {
            const template_path = Jupyter.notebook.base_url + 'nbextensions/anthem_notebook/template.ipynb';
            $.getJSON(template_path, json => {
                let cells = json['cells'];
                cells.forEach((item, index) => {
                    Jupyter.notebook.insert_cell_at_index(item['cell_type'], index).set_text(item['source'].join(''));
                    let present_cell = Jupyter.notebook.get_cell(index);
                    if(present_cell.cell_type ==='markdown')
                    {   
                        present_cell.metadata = item.metadata;
                        present_cell.execute();
                    }                 
                });
            });
        };

        // Prompts user to enter name for notebook if 'Untitled' in name
        const prompt_name = function () {
            if (Jupyter.notebook.notebook_name.includes('Untitled')) {
                document.getElementsByClassName('filename')[0].click();
            }
        };


        //Function on initialize
        const initialize = function () {        
            if (Jupyter.notebook.ncells() === 1 && Jupyter.notebook.get_cell(0).source === undefined) //Empty notebook 
            {
                console.log(log_prefix + 'Configuration read: adding template cells');
                add_sections();
                JupyterEvents.on('kernel_ready.Kernel', prompt_name); //When the kernel is ready, ask for filename
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
