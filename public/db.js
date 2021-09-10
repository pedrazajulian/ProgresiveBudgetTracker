let db;
let budgetVersion;

//create new DB request for a "budget" database
const request = indexedDB.open("BudgetDB", budgetVersion || 21);

request.onupgradeneeded = function (event) {
    console.log("Upgrade needed in IndexDB");

    const { oldVersion } = event;
    const newVersion = event.newVersion || db.version;

    console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

    db = event.target.result;

    if (db.objectStoreNames.length === 0) {
        db.createObjectStore("BudgetStore", { autoIncrement: true });
    }
};

request.onerror = function (event) {
    console.log(`Woops! ${event.target.errorCode}`);
};

function checkDatabase() {
    console.log("check db invoked");

    //open transaction on BudgetStore db
    let transaction = db.transaction(["BudgetStore"], "readwrite");

    //access BudgetStore object
    const store = transaction.objectStore("BudgetStore");

    //get all records from store and set to variable
    const getAll = store.getAll();

    //if request succesful
    getAll.onsuccess = function () {
        console.log("test");
        //if items in store, need to bulk add them when back online
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json',
                },
            })
            .then((response) => response.json())
            .then((res) => {
                //if returned response is not empy
                if (res.length !== 0) {
                    //open another transaction to BudgetStore with the abiliity to read and write
                    transaction = db.transaction(["BudgetStore"], "readwrite");

                    //assign the current store to a variable
                    const currentStore = transaction.objectStore("BudgetStore");

                    //clear existing entries b/c bulk add was successful
                    currentStore.clear();
                    console.log("Clearing store");
                }
            });
        }
    };
};

request.onsuccess = function (event) {
    console.log("success");
    db = event.target.result;

    //check if application is online before reading from db
    if (navigator.onLine) {
        console.log('Backend online!');
        checkDatabase();
      }
};

const saveRecord = (record) => {
    console.log("Save record invoked.");
    //create transaction on the BudgetStore DB with readwrite access
    const transaction = db.transaction(["BudgetStore"], "readwrite");

    //access BudgetStore object
    const store = transaction.objectStore("BudgetStore");

    //add record to store with add method
    store.add(record);
};

//listen for app to come back online
window.addEventListener("online", checkDatabase);