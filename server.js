const http = require("http");
const fs = require('fs')
const fse = require("fs-extra");
const path = require("path")
const multiparty = require("multiparty");
const server = http.createServer();
const UPLOAD_DIR = path.resolve(__dirname, "./", "target");
const resolvePost = req => {
  return new Promise((resolve, reject) => {
    let chunk = '';
    req.on('data', data => {
      chunk += data;
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(chunk));
      } catch (err) {
        reject(err)
      }
    });
  })
}
const mergeFile = async (filePath, filename, len) => {
  
}
server.on("request", async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  const { method, url } = req;
  if (url == '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    fs.readFile('./public/index.html', 'utf-8', function(err,data){
      if(err){
        throw err ;
      }
      res.end(data);
    })
  }
  if (url == '/api/upload') {
    const multipart = new multiparty.Form();
    multipart.parse(req, async (err, fields, files) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log(files);
      console.log(fields);
      const [chunk] = files.chunk;
      const [filename] = fields.filename;
      const [index] = fields.index;

      if (!fse.existsSync(UPLOAD_DIR)) {
        fse.mkdirSync(UPLOAD_DIR)
      }
      fse.moveSync(chunk.path, `${UPLOAD_DIR}/${filename}/${filename}-${index}`)
      res.end('received')
    })
  }
  if (url == 'api/merge') {
    const data = await resolvePost(req)
    const { file, length } = data
    const filePath = path.resolve(UPLOAD_DIR, file)
    await mergeFile(filePath, file, length)
    res.end('ok')
  }
});

server.listen(3000, () => console.log("3000 is listenning"));

