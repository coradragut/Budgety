//BUDGET CONTROLLER
var budgetController = (function(){
    
    var Expense = function(id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1; //not defined, so we initialize it to -1 for now
    };
    
    Expense.prototype.calcPercentage = function(totalIncome){
        
        if(totalIncome > 0){
            this.percentage = Math.round ((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }    
    };
    
    Expense.prototype.getPercentage = function(){
        return this.percentage; 
    };
    
    var Income = function(id, description, value){
        this.id = id;
        this.description = description;
        this.value = value;
    };
    
 
    var calculateTotal = function(type){
        var sum = 0;
        data.allItems[type].forEach(function(cur){
            sum += cur.value;
        });
        data.totals[type] = sum;
    };
    
    var data = {
        
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };
    
    
    return {
        addItem: function(type, des, val){
            var newItem, ID;
            
            //create new ID
            if(data.allItems[type].length > 0){
                //id=lastID+1 (because we might have cases where we deleted some ids and we are left with something like [1, 2, 4, 8], so next id should be 9)
                //[data.allItems[type].length-1] = index of exp/inc array
                 ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }
           
            
            //create new item based on 'exp' or 'inc' type
            if(type === 'exp'){
                newItem = new Expense(ID, des, val);
            } else if( type === 'inc'){
                newItem = new Income(ID, des, val);
            }
            
            //push it into our data structure
            data.allItems[type].push(newItem);
            
            //return the new element
            return newItem;
        },
        
        deleteItem: function(type, id){
            var ids, index;
            
            ids = data.allItems[type].map(function(current){
                return current.id;
            });
            
            index = ids.indexOf(id);
            
            if(index !== -1){
                data.allItems[type].splice(index, 1);
            }
        },
        
        calculateBudget: function(){
            
            //calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');
            
            //calculate the budget: income-expenses
            data.budget = data.totals.inc - data.totals.exp;
            
            //calculate the percentage of income that we spent
            if(data.totals.inc > 0){
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
            
        },
        
        
        calculatePercentages: function(){
             data.allItems.exp.forEach(function(cur){
                 cur.calcPercentage(data.totals.inc);
             });  
        },
        
        getPercentages: function(){
             var allPerc = data.allItems.exp.map(function(cur){
                return cur.getPercentage();
             });  
             return allPerc;   
        },
        
        getBudget: function(){
          return{
              budget: data.budget,
              totalInc: data.totals.inc,
              totalExp: data.totals.exp,
              percentage: data.percentage
          };  
        },
        
       // testing: function(){
        // console.log(data);
        //}
    };   
}) ();




// UI CONTROLLER
var UIController = (function() {
    
    //private object - if we need to change name of a class in html doc, do it only here and not throughout the whole document
     var DOMstrings = {
         inputType: '.add__type',
         inputDescription: '.add__description',
         inputValue: '.add__value',
         inputBtn: '.add__btn',
         incomeContainer: '.income__list',
         expensesContainer: '.expenses__list',
         budgetLabel: '.budget__value',
         incomeLabel: '.budget__income--value',
         expensesLabel: '.budget__expenses--value',
         percentageLabel: '.budget__expenses--percentage',
         container: '.container',
         expensesPercLabel: '.item__percentage',
         dateLabel: '.budget__title--month'
    };
    
    var formatNumber = function(num, type){
            var numSplit, int, dec;
            
            // + or - before number
            // exactly 2 decimal points
            // comma separating the thousands
            //ex. 2310.4567 -> + 2,310.46
            
            num = Math.abs(num);
            num = num.toFixed(2); //for 2 decimals; it is a string
            
            numSplit = num.split('.'); //will be stored in an array
            
            int = numSplit[0]; //still a string
            if(int.length > 3){ //more than 3 cifre means thousand
               int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3); //input 2310, output 2,310 
            }
            
            
            dec = numSplit[1]; //still a string
            
            return  (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
            
        };
    
     var nodeListForEach = function(list, callback){
         for (var i = 0; i < list.length; i++){
            callback(list[i], i);
        }  
    };
    
     //public stuff: functions, objects
    return {
        getInput: function(){
            return {
                type: document.querySelector(DOMstrings.inputType).value,   // will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };   
        },
        
        addListItem: function(obj, type){
            var html, newHtml, element;
            
            //create HTML string with placeholder text
            if( type === 'inc'){
                element = DOMstrings.incomeContainer;
                
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp'){
                element = DOMstrings.expensesContainer;
                
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            
            //replace the placeholder text with some actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));
            
            
            //insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },
        
        deleteListItem: function(selectorID){
            var el = document.getElementById(selectorID);
            
            el.parentNode.removeChild(el);
        },
        
        clearFields: function(){
            var fields, fieldsArr  ;
            
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            
            fieldsArr = Array.prototype.slice.call(fields);
            
            fieldsArr.forEach(function(current, index, array){
                current.value = "";
            });
            
            //after adding an income/expense item, the item description field will be in focus
            fieldsArr[0].focus();
            
        },
        
        displayBudget: function(obj){
            var type;
            obj.budget >= 0 ? type = 'inc' : type = 'exp';
            
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');
            
            if(obj.percentage > 0){
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else{
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
        },
        
        displayPercentages: function(percentages){
            
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);
            
            nodeListForEach(fields, function(current, index) {
                if (percentages[index] > 0){
                    current.textContent = percentages[index] + '%';
                } else{
                    current.textContent = '---';
                }
            });
            
        },
        
        displayMonth: function(){
            var now, year, month, months;
            now = new Date();
            // or var christmas = new Date(2016, 11, 25); -> 25.12.2016; months are 0 based aka start from 0
            
            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            
            month = now.getMonth();
            year = now.getFullYear();
            
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
            
        },
        
        changedType: function(){
            
            // returns a node list
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue 
            );

            nodeListForEach(fields, function(cur){
               cur.classList.toggle('red-focus'); 
            });
            
            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
            
        },  
        
        //we expose it into the public so we can call it in the controller and use them there
        getDOMstrings: function(){
            return DOMstrings; 
        }
    };
})();




//GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, UICtrl){
    
    
    var setupEventListeners = function(){
        
        var DOM = UICtrl.getDOMstrings();
        
        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);
    
    
        document.addEventListener('keypress', function(event){
            if(event.keyCode === 13 || event.which === 13){
                ctrlAddItem();
            }
        });
        
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);
        
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
        
    };
    
    
    var updateBudget = function(){
        
        //1. calculate the budget
        budgetCtrl.calculateBudget();
        
        //2. return the budget
        var budget = budgetCtrl.getBudget();
        
        //3. display the budget on UI
        UICtrl.displayBudget(budget);
        
    };
    
    var updatePercentages = function(){
        
        //1.calculate percentages
        budgetCtrl.calculatePercentages();
        
        //2.read percentages from budget controller
        var percentages = budgetCtrl.getPercentages();
        
        //3. update the UI with the new percentages
        UICtrl.displayPercentages(percentages);
        
        
    };
      
    var ctrlAddItem = function(){
        
        var input, newItem;
        
        //1. get the field input data
        input = UICtrl.getInput();
        
        if(input.description !== "" && !isNaN(input.value) && input.value > 0){
            //2. add the item to the budget controller
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            //3. add the item to the UI
            UICtrl.addListItem(newItem, input.type);

            //3b. clear the fields
            UICtrl.clearFields();

            //4. calculate and update budget
            updateBudget();
            
            //5. calculate and update percentages
            updatePercentages();
        }        
    };
    
    
    var ctrlDeleteItem = function(event){
        var itemID, splitID, type, ID;
        
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        
        if(itemID){
            
            //inc-1
            //will return an array with [inc, 1]-> splitID[0] = 'inc'; splitID[1] = '1'; 
            //'split' method transforms the strings or numbers into objects, so afterwards we can apply methods to them.
            splitID = itemID.split('-'); 
            type = splitID[0];
            ID = parseInt(splitID[1]);
            
            //1.delete the item from the data structure
            budgetCtrl.deleteItem(type, ID);
            
            //2.delete the item from the UI
            UICtrl.deleteListItem(itemID);
            
            //3.update and show the new budget
            updateBudget();
            
            //4.calculate and update percentages
            updatePercentages();
            
        }
        
    };
    
    return {
        init: function(){
            UICtrl.displayMonth();
            UICtrl.displayBudget({
              budget: 0,
              totalInc: 0,
              totalExp: 0,
              percentage: -1
            });
            setupEventListeners();
        }
    };
 
    
    
}) (budgetController, UIController);


controller.init();
















