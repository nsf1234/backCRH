var Usuario = require("../models/usuario");

exports.crearUsuario = ((req,res)=>{
    Usuario.create(req.body,
    (err,docs)=>{
        if(!err){
            res.status(200).send(docs)
        }else{
            console.log(err);
            res.status(207).send("Error");
        }
    });
});

exports.obtenerUsuario = ((req,res)=>{
    console.log(req);
    Usuario.find({username:req.query.username,password:req.query.password},
    (err,docs)=>{
        if(!err){
            res.json(docs);
        }else{
            console.log(err);
            res.status(404).send("Error");
        }
    })
});
/*
exports.obtenerContrasena = ((req,res)=>{
    Usuario.find({contrasena:req.query.contrasena},
    (err,docs)=>{
        if(!err){
            res.json(docs);
        }else{
            console.log(err);
            res.status(404).send("Error");
        }
    })
});
*/
/*
exports.modificarUsuario = ((req,res)=>
    Usuario.replaceOne({
        _id: req.body._id
    },
    req.body,
    (err,docs)=>{
        if(!err){
            res.status(200).send("Listo")
        }else{
            console.log(err);
            res.status(207).send("Error");
        }
    })
);

exports.eliminarUsuario = ((req,res)=>
    Usuario.deleteOne({
        _id: req.query._id
    },
    (err,docs)=>{
        if(!err){
            res.status(200).send("Listo")
        }else{
            console.log(err);
            res.status(207).send("Error");
        }
    })
);
*/