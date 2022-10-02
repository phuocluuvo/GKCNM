const express = require("express");
const app = express();
const AWS = require("aws-sdk");
const multer = require("multer");
const upload = multer();
//const s3 = new AWS.S3({ apiVersion: "2022-08-29" });
// const bucketParams = { Bucket: process.argv[2] };
// s3.getBucketCors(bucketParams, (err, data) => {
//   if (err) console.log(err);
//   if (data) console.log(JSON.stringify(data.CORSRules));
// });
AWS.config = new AWS.Config({
  accessKeyId: "",
  secretAccessKey: "",
  region: "us-east-1",
});

app.use(express.static("./views"));
app.set("view engine", "ejs");
app.set("views", "./views");
const tbl_Name = "BaiBao_OnThi";
const docClient = new AWS.DynamoDB.DocumentClient();

app.get("/", (req, res) => {
  return res.render("input");
});

app.get("/list", (req, res) => {
  const p = {
    TableName: tbl_Name,
  };
  docClient.scan(p, (err, data) => {
    if (err) {
      res.send("Internal Server Error");
      return;
    }
    if (data) {
      return res.render("index", { baiBao: data.Items });
    }
  });
});

app.post("/", upload.fields([]), (req, res) => {
  const { tenBaiBao, soTrang, tenNhomTacGia, ISBN, NXB } = req.body;
  docClient.scan(
    {
      TableName: tbl_Name,
    },
    (err, data) => {
      if (err) {
        res.send("Internal Server Error");
        return;
      }
      if (data) {
        const p = {
          TableName: tbl_Name,
          Item: {
            maBao: data.Items.length + 1,
            soTrang: soTrang,
            tenBaiBao: tenBaiBao,
            tenNhomTacGia: tenNhomTacGia,
            ISBN: ISBN,
            NXB: NXB,
          },
        };
        docClient.put(p, (err, data) => {
          if (err) {
            res.send("Internal Server Error:" + err);
            return;
          } else return res.redirect("/list");
        });
      }
    }
  );
});
app.post("/delete", upload.fields([]), (req, res) => {
  const listItems = Object.keys(req.body);

  if (listItems.length === 0) {
    return res.redirect("/list");
  }

  const onDelete = (i) => {
    const p = {
      TableName: tbl_Name,
      Key: {
        maBao: Number(listItems[i]),
      },
    };
    docClient.delete(p, (err, data) => {
      if (err) return res.send("Interal Sever Error" + err);
      else {
        if (i > 0) onDelete(i - 1);
        else return res.redirect("/list");
      }
    });
  };
  onDelete(listItems.length - 1);
});
app.listen(5500, () => {
  console.log("server listening on port 5500");
});
