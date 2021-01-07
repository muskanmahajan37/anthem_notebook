log_prefix = '[anthem_notebook] '; //to debug extension
define(['jquery', 'base/js/namespace', 'base/js/events'],
    function ($, Jupyter, JupyterEvents) {
        "use strict";// why strict https://www.w3schools.com/js/js_strict.asp
        let msg_cells = {};

        /**************************************************************************/

        //Function to create and execute a cell
        const create_and_execute_cell = function (cell_type, index, cell_id, set_text, exe_val) {
            let present_cell = Jupyter.notebook.insert_cell_at_index(cell_type, index);
            present_cell.cell_id = cell_id + present_cell.cell_id;
            switch (cell_type) {
                case 'markdown':
                    present_cell.set_text(set_text);
                    break;
                case 'code':
                    present_cell.execute = execute_initial;
                    break;
                default:
                    print('Invalid cell type');
            }
            if (exe_val) {
                present_cell.execute();
            }
        };

        /**************************************************************************/

        //  Function to get the cell index and cell_id of a cell if it's cell_id includes the given string 
        const index_from_cellid = function (cellid) {
            let index = -1;
            let cid = "";
            for (let i = (Jupyter.notebook.ncells() - 1); i >= 0; i--) {
                if (Jupyter.notebook.get_cell(i).cell_id.includes(cellid)) {
                    index = i;
                    cid = Jupyter.notebook.get_cell(i).cell_id;
                    break;
                }
            }
            return [index, cid];
        };

        /**************************************************************************/

        // Function to cell initially
        const add_sections = function () {
            create_and_execute_cell('markdown',0, 'input_md_{0}', '### Inputs ' , true);
            create_and_execute_cell('markdown',1, 'assume_md_{0}', '### Assumptions', true);
            create_and_execute_cell('markdown',2, 'achieve_md_{0}', '## Achievements', true);
        };

        /**************************************************************************/
        /**************************************************************************/

        //  Function to rompts user to enter name for notebook if 'Untitled' in name
        const prompt_name = function () {
            if (Jupyter.notebook.notebook_name.includes('Untitled')) {
                document.getElementsByClassName('filename')[0].click();
            }
        };

        
        /**************************************************************************/
        /**************************************************************************/
        /**************************************************************************/
        /**************************************************************************/

        const execute_initial = function (stop_on_error) {
            if (!this.kernel) {
                console.log(i18n.msg._("Can't execute cell since kernel is not set."));
                return;
            }

            if (stop_on_error === undefined) {
                if (this.metadata !== undefined &&
                    this.metadata.tags !== undefined) {
                    if (this.metadata.tags.indexOf('raises-exception') !== -1) {
                        stop_on_error = false;
                    } else {
                        stop_on_error = true;
                    }
                } else {
                    stop_on_error = true;
                }
            }

            this.clear_output(false, true);
            var old_msg_id = this.last_msg_id;
            if (old_msg_id) {
                this.kernel.clear_callbacks_for_msg(old_msg_id);
                delete msg_cells[old_msg_id];
                this.last_msg_id = null;
            }
            if (this.get_text().trim().length === 0) {
                // nothing to do
                this.set_input_prompt(null);
                return;
            }
            this.set_input_prompt('*');
            this.element.addClass("running");
            var callbacks = this.get_callbacks();
            const nb_name = Jupyter.notebook.notebook_name.slice(0, -6);
            let code_str = '';
            if (this.cell_id.includes("assume_code_") || this.cell_id.includes("input_code_")) {
                const create_dir = "import os\nif not os.path.exists('" + nb_name + "'):\n   os.makedirs('" + nb_name + "')";
                this.kernel.execute(create_dir);
                code_str = '%%writefile -a ' + nb_name + '/' + nb_name + '.spec \n' + this.get_text();
            }
            if (this.cell_id.includes("output_code_") || this.cell_id.includes("specif_code_")) {   //if no main dir, create dir
                const create_dir = "import os\nif not os.path.exists('" + nb_name + "'):\n   os.makedirs('" + nb_name + "')";
                this.kernel.execute(create_dir);
                //if no achieve sub, create sub
                const achieve_n = this.cell_id.slice(12, 13);
                const dir_name = nb_name + "/achieve" + achieve_n;
                const create_sub_dir = "import os\nif not os.path.exists('" + dir_name + "'):\n   os.makedirs('" + dir_name + "')";
                this.kernel.execute(create_sub_dir);
                //if no files, create the files
                const file_1 = nb_name + "/" + nb_name + ".spec";
                const file_2 = nb_name + "/" + nb_name + ".lp";
                const file_3 = nb_name + "/" + nb_name + ".lemmas";
                const files_to_copy_create = "f1 = open('" + file_1 + "', 'a')\nf1.close()\nf2 = open('" + file_2 + "', 'a')\nf2.close()\nf3 = open('" + file_3 + "', 'a')\nf3.close()";
                console.log(files_to_copy_create);
                this.kernel.execute(files_to_copy_create);
                //copy files to achieve folder from main
                const create_file_copy = "import os\nfrom shutil import copyfile\nif not os.path.exists('" + dir_name + "/" + nb_name + ".spec'):\n   copyfile('" + file_1 + "','" + dir_name + "/" + nb_name + ".spec')";
                console.log(create_file_copy);
                //const copy_file1 = "!cp "+file_1+" "+dir_name+"/"+nb_name + ".specs";
                this.kernel.execute(create_file_copy);
                // const copy_file2 = "!cp "+file_2+" "+dir_name+"/"+nb_name + ".lp";
                // this.kernel.execute(copy_file2);
                // const copy_file3 = "!cp "+file_3+" "+dir_name+"/"+nb_name + ".lemmas";
                // this.kernel.execute(copy_file3);
                //write to achieve folder spec file
                code_str = "%%writefile -a " + dir_name + "/" + nb_name + ".spec\n" + this.get_text();
            }

            if (this.cell_id.includes("asp_code_")) {
                const achieve_n = this.cell_id.slice(9, 10);
                const dir_name = nb_name + "/achieve" + achieve_n;
                const file_2 = nb_name + "/" + nb_name + ".lp";
                const file_22 = nb_name + "/" + nb_name + ".spec";
                const code_n = this.cell_id.slice(11, 12);
                const code_file_name = dir_name + "/" + nb_name + code_n + ".lp";
                const code_file_name2 = dir_name + "/" + nb_name + ".spec";
                const copy_file_2 = "!cp " + file_2 + " " + code_file_name;
                this.kernel.execute(copy_file_2);
                const new_code = "%%writefile -a " + code_file_name + "\n" + this.get_text();
                this.kernel.execute(new_code);
                //replace main files with acheve files
                const copy_file_3 = "!cp -f " + code_file_name + " " + file_2;
                console.log(copy_file_3);
                this.kernel.execute(copy_file_3);
                const copy_file_4 = "!cp -f " + code_file_name2 + " " + file_22;
                console.log(copy_file_4);
                this.kernel.execute(copy_file_4);
                //run from main folder
                code_str = "!anthem verify-program " + file_2 + " " + file_22;
                console.log(code_str);
            }
            this.last_msg_id = this.kernel.execute(code_str, callbacks, {
                silent: false, store_history: true,
                stop_on_error: stop_on_error
            });
            msg_cells[this.last_msg_id] = this;
            this.render();
            this.events.trigger('execute.CodeCell', { cell: this });
            var that = this;
            function handleFinished(evt, data) {
                if (that.kernel.id === data.kernel.id && that.last_msg_id === data.msg_id) {
                    that.events.trigger('finished_execute.CodeCell', { cell: that });
                    that.events.off('finished_iopub.Kernel', handleFinished);
                }
            }
            this.events.on('finished_iopub.Kernel', handleFinished);
            this.execute = null;
        };

        /**************************************************************************/
        /**************************************************************************/

        const add_3_input_cells = function () {
            const cell_val = index_from_cellid('input_md_');            
            const input_n = parseInt(cell_val[1].substring(10,cell_val[1].indexOf('}'))) + 1;
            let index = input_n>1?cell_val[0]+2:cell_val[0];
            create_and_execute_cell('markdown',index + 1, 'input_md_{' + input_n +'}', '#### Input ' + input_n, true);
            create_and_execute_cell('markdown',index + 2, 'input_desc_{' + input_n +'}', 'Add Description of Input ' + input_n, false);
            create_and_execute_cell('code', index + 3, 'input_code_{'+ input_n+'}','',false);
        };
        /**************************************************************************/

        // define input action, register with ActionHandler instance
        const input_prefix = 'add3inputs';
        const input_name = 'add 3 input cells';
        const input_action = {
            icon: 'fa-bold',
            help: 'Add 3 md cells',
            help_index: 'zz',
            id: 'add_3_md_cells',
            handler: add_3_input_cells
        };

        /**************************************************************************/
        /**************************************************************************/

        const add_3_assume_cells = function () {
            const cell_val = index_from_cellid('assume_md_');
            const assume_n = parseInt(cell_val[1].substring(11,cell_val[1].indexOf('}'))) + 1;
            let index = assume_n>1?cell_val[0]+2:cell_val[0];
            create_and_execute_cell('markdown',index + 1, 'assume_md_{' + assume_n +'}', '#### Assume ' + assume_n, true);
            create_and_execute_cell('markdown',index + 2, 'assume_desc_{' + assume_n +'}', 'Add Description of Assumption' + assume_n, false);
            create_and_execute_cell('code', index + 3, 'assume_code_{'+ assume_n + '}','',false);
        };
        /**************************************************************************/



        /**************************************************************************/

        // define input action, register with ActionHandler instance
        const assume_prefix = 'add3assume';
        const assume_name = 'add 3 assume cells';
        const assume_action = {
            icon: 'fa-italic',
            help: 'Add 3 md assume cells',
            help_index: 'zza',
            id: 'add_3_mdassume_cells',
            handler: add_3_assume_cells
        };

        /**************************************************************************/
        /**************************************************************************/
        const execute_lp = function (stop_on_error) {
            if (!this.kernel) {
                console.log(i18n.msg._("Can't execute cell since kernel is not set."));
                return;
            }

            if (stop_on_error === undefined) {
                if (this.metadata !== undefined &&
                    this.metadata.tags !== undefined) {
                    if (this.metadata.tags.indexOf('raises-exception') !== -1) {
                        stop_on_error = false;
                    } else {
                        stop_on_error = true;
                    }
                } else {
                    stop_on_error = true;
                }
            }

            this.clear_output(false, true);
            var old_msg_id = this.last_msg_id;
            if (old_msg_id) {
                this.kernel.clear_callbacks_for_msg(old_msg_id);
                delete msg_cells[old_msg_id];
                this.last_msg_id = null;
            }
            if (this.get_text().trim().length === 0) {
                // nothing to do
                this.set_input_prompt(null);
                return;
            }
            this.set_input_prompt('*');
            this.element.addClass("running");
            var callbacks = this.get_callbacks();
            const nb_name = Jupyter.notebook.notebook_name.slice(0, -6);


            let code_str = '!anthem verify-program ' + nb_name + '.{lp,spec,lemmas}';


            this.kernel.execute("%%writefile -a " + nb_name + ".lemmas \n ");
            this.kernel.execute("%%writefile -a " + nb_name + ".lp\n" + this.get_text());


            this.last_msg_id = this.kernel.execute(code_str, callbacks, {
                silent: false, store_history: true,
                stop_on_error: stop_on_error
            });
            msg_cells[this.last_msg_id] = this;
            this.render();
            this.events.trigger('execute.CodeCell', { cell: this });
            var that = this;
            function handleFinished(evt, data) {
                if (that.kernel.id === data.kernel.id && that.last_msg_id === data.msg_id) {
                    that.events.trigger('finished_execute.CodeCell', { cell: that });
                    that.events.off('finished_iopub.Kernel', handleFinished);
                }
            }
            this.events.on('finished_iopub.Kernel', handleFinished);
        };
        /**************************************************************************/

        const add_achievement_cells = function () {
            let index = Jupyter.notebook.ncells() - 1;
            let cell_val = index_from_cellid('achieve_md_');
            const achieve_n = parseInt(cell_val[1].slice(12)) + 1;
            create_and_execute_cell('markdown',index, 'achieve_md_{' + achieve_n+'}', '### Achievement ' + achieve_n, true);
            create_and_execute_cell('markdown',index + 1, 'achieve_desc_{' + achieve_n+'}', 'Add Description of Achievement ' + achieve_n, false);
            cell_val = index_from_cellid('output_md_');
            let output_n = cell_val[0] < 0 ? 1 : (parseInt(cell_val[1].slice(11)) + 1);
            create_and_execute_cell('markdown',index + 2, 'output_md_{' + output_n +'}', '#### Output ' + output_n, true);
            create_and_execute_cell('markdown',index + 3, 'output_desc_{' + output_n +'}', 'Add Description of Output ' + output_n, false);
            create_and_execute_cell('code',index + 4, 'output_desc_{' + output_n +'}','',false);
            create_and_execute_cell('markdown',index + 5, 'spec_md_{' + achieve_n +'}', '#### Specification ' + achieve_n, true);
            create_and_execute_cell('markdown',index + 6, 'spec_desc_{' + achieve_n +'}', 'Add Description of Specification ' + achieve_n, false);
            create_and_execute_cell('code', index + 7, 'specif_code_{'+ achieve_n +'}','',false);
            create_and_execute_cell('markdown',index + 8, 'asp_md_{' + achieve_n +'}', '#### ASP code ' + achieve_n, true);
            create_and_execute_cell('code',index + 9, 'asp_code_{'+ achieve_n +'}','',false);
        };
        /**************************************************************************/

        // define input action, register with ActionHandler instance
        const achievement_prefix = 'achievement';
        const achievement_name = 'add achievement cells';
        const achievement_action = {
            icon: 'fa-check',
            help: 'Add achievement cells',
            help_index: 'zza',
            id: 'add_achievement_cells',
            handler: add_achievement_cells
        };



        /**************************************************************************/
        /**************************************************************************/
        /**************************************************************************/





        //main function: executes when the extenion is loaded
        const load_ipython_extension = function () {
            if (Jupyter.notebook.ncells() === 1 && Jupyter.notebook.get_cell(0).source === undefined) //Empty notebook 
            {
                console.log(log_prefix + 'Configuration read: adding template cells');
                add_sections();
                JupyterEvents.on('kernel_ready.Kernel', prompt_name); //When the kernel is ready, ask for filename
            }
            let input_action_full_name = Jupyter.keyboard_manager.actions.register(input_action, input_name, input_prefix);
            let assume_action_full_name = Jupyter.keyboard_manager.actions.register(assume_action, assume_name, assume_prefix);
            let achievement_action_full_name = Jupyter.keyboard_manager.actions.register(achievement_action, achievement_name, achievement_prefix);

            Jupyter.toolbar.add_buttons_group([input_action_full_name, assume_action_full_name, achievement_action_full_name]);
        };

        return {
            load_ipython_extension: load_ipython_extension
        };
    }
);








