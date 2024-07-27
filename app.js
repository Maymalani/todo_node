var express = require('express');
var app = express();
var mysql = require('mysql');
var bodyParser = require('body-parser');
const { render } = require('ejs');
var port = process.env.PORT || 3000;

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }))

var con = mysql.createConnection({
    database: 'todo',
    host: 'localhost',
    user: 'root',
    password: ''
});

con.connect();

var adminLogin = 0;
var staffLogin = 0

app.get('/', (req, res) => {
    if (adminLogin == 0) {
        res.render('admin_login');
    } else {
        res.redirect('/admin');
    }
});

app.post('/', (req, res) => {

    var email = req.body.email;
    var password = req.body.password;

    var sel = "select * from admin where email = '" + email + "' and password = '" + password + "'";

    con.query(sel, (err, result, index) => {
        if (err) throw err;
        if (result.length == 1) {
            adminLogin = 1;
            res.redirect('/admin');
        } else {
            res.redirect('/');
        }
    })
});

app.get('/admin', (req, res) => {
    if (adminLogin == 1) {
        res.render('admin');
    } else {
        res.redirect('/');
    }
});

app.get('/admin_logout',(req,res) => {
    adminLogin = 0;
    res.redirect('/admin')
});

app.get('/add_staff', (req, res) => {
    res.render('add_staff');
});

app.post('/add_staff', (req, res) => {
    var { staffName, staffEmail, staffPassword } = req.body;

    var ins = "insert into staff(staff_name,staff_email,staff_password) values('" + staffName + "','" + staffEmail + "','" + staffPassword + "')";

    con.query(ins, (err, result, index) => {
        if (err) throw err;
        res.redirect('/admin');
    })
});

app.get('/view_staff', (req, res) => {
    var sel = "select * from staff";
    con.query(sel, (err, result, index) => {
        if (err) throw err;
        res.render('view_staff', { result })
    })
});

app.get('/manage_staff', (req, res) => {
    var sel = "select * from staff";
    con.query(sel, (err, result, index) => {
        if (err) throw err;
        res.render('manage_staff', { result })
    })
});

app.get('/updateStatus/:id/:status', (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    var upd = "update staff set status = '" + status + "' where id='" + id + "'";
    con.query(upd, (err, result, index) => {
        if (err) throw err;
        res.redirect('/view_staff');
    })
})

app.get('/add_task', (req, res) => {
    var sel = "select * from staff";
    con.query(sel, (err, result, index) => {
        if (err) throw err;
        res.render('add_task', { result });
    })
});

app.post('/add_task', (req, res) => {
    var staffId = req.body.staff;
    var task = req.body.task;
    var date = req.body.date;

    var upd = "insert into task(staff_name,task,task_date,task_status) values('" + staffId + "','" + task + "','" + date + "','pending')";
    con.query(upd, (err, result, index) => {
        if (err) throw err;
        res.redirect('/admin');
    })
});

app.get('/view_task', (req, res) => {
    var sel = "select * from task";

    con.query(sel, (err, result, index) => {
        if (err) throw err;
        res.render('view_task', { result });
    })
});

app.get('/manage_task',(req,res) => {
    var sel = "select * from task where task_status = 'pending'";
    con.query(sel,(err,result,index) => {
        if(err) throw err;
        res.render('manage_task',{result})
    })
});

app.get('/transfer_task/:name/:id/:task',(req,res) => {
    var stfName = req.params.name;
    var sel = "select * from staff where staff_name != '"+stfName+"' ";
    con.query(sel,(err,result,index) => {
        if(err) throw err;
        res.render('transfer_task',{result});
    })
});

app.post('/transfer_task/:name/:id/:task',(req,res) => {
    var tskId = req.params.id;
    var taskName = req.params.task;
    var stf = req.body.trans_staff;
    var date = req.body.task_date;
    var del = "delete from task where id = '"+tskId+"'";
    var ins = "insert into task(staff_name,task,task_date,task_status) values('" + stf + "','" + taskName + "','" + date + "','pending')";
    con.query(del,(err,result,index) => {
        if(err) throw err;
        con.query(ins,(err,result,index) => {
            if(err) throw err;
            res.redirect('/manage_task');
        })
    })

});


app.get('/view_task_status', (req, res) => {
    var sel = "select * from task";
    con.query(sel, (err, result, index) => {
        if (err) throw err;
        res.render('view_task_status', { result });
    })
});

app.get('/staff_login', (req, res) => {
    res.render('staff_login')
});

app.post('/staff_login', (req, res) => {
    var email = req.body.staffEmail;
    var password = req.body.staffPassword;

    var sel = "select * from staff where staff_email = '" + email + "' and staff_password = '" + password + "' ";

    con.query(sel, (err, result, index) => {
        if (err) throw err;
        if (result.length == 1) {
            staffLogin = 1;
            localStorage.setItem('staffName', result[0].staff_name);
            res.redirect('/staff');
        }
    })
});

app.get('/staff_logout',(req,res) => {
    staffLogin = 0;
    res.redirect('/staff_login')
})

app.get('/staff', (req, res) => {
    if (staffLogin == 1) {
        res.render('staff');
    } else {
        res.redirect('/staff_login')
    }
});

app.get('/staff_view_task', (req, res) => {
    var stfName = "select staff.staff_name , task.* from task join staff on staff.id=task.staff_name"
    var staffName = localStorage.getItem('staffName');

    var sel = "select * from task where staff_name = '" + staffName + "'";
    // con.query(sel, (err, result, index) => {
        // if (err) throw err;
        con.query(sel,(err,result,index) => {
            if(err) throw err;
            res.render('staff_view_task', { result });
        })
    // })
});

app.get('/staff_update_task_status', (req, res) => {
    var staffName = localStorage.getItem('staffName');

    var sel = "select * from task where staff_name = '" + staffName + "'";
    con.query(sel, (err, result, index) => {
        if (err) throw err;
        res.render('staff_update_task_status', { result })
    })
});

app.get("/update/:id/:status", (req, res) => {
    var id = req.params.id;
    var status = req.params.status;

    var upd = "update task set task_status = '" + status + "' where id = '" + id + "'";
    con.query(upd, (err, result, index) => {
        if (err) throw err;
        res.redirect('/staff_update_task_status')
    })
})

app.get('/staff_view_task_status_wise', (req, res) => {
    res.render('staff_view_task_status_wise')
});

app.get('/view_task/:status', (req, res) => {
    var staffName = localStorage.getItem('staffName');
    var status = req.params.status;

    var sel = "select * from task where staff_name = '" + staffName + "' and task_status = '" + status + "'";
    con.query(sel, (err, result, index) => {
        if (err) throw err;
        res.render('status_wise_task_view',{result,status});
    })
})

app.listen(port);

