const express = require('express')
const app = express()
const bodyParser= require('body-parser')
app.use(bodyParser.urlencoded({extended: true}))
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const { ObjectId } = require('mongodb');
app.use(session({secret : '비밀코드', resave : true, saveUninitialized: false}));
app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

var db;
MongoClient.connect('mongodb+srv://admin:qwer1234@cluster0.ggtwbdl.mongodb.net/todoapp?retryWrites=true&w=majority', { useUnifiedTopology: true }, function(에러, client){
    //연결되면 할일
    if (에러) return console.log(에러)

    db = client.db('todoapp');
   
    app.listen(3000, function() {
        console.log('listening on 3000')
    });
});

function 로그인했니(요청, 응답, next) { 
  if (요청.user) { 
    next() 
  } 
  else { 
    응답.send("<script>alert('로그인 후 이용 가능합니다.'); window.location.href = '/login';</script>");
  } 
} 

app.get('/', async function(req, res){
  const page = parseInt(req.query.page) || 1;
  const pageSize = 3;

  // Find all posts
  const allPosts = await db.collection('post').find().toArray();

  const admins = await db.collection('admin').find().toArray();
  const logins = await db.collection('login').find().toArray();

  const adminSet = new Set(admins.map(admin => admin._id.toString()));
  const loginSet = new Set(logins.map(login => login._id.toString()));

  // Separate posts by admin and non-admin
  const adminPosts = [];
  const userPosts = [];

  allPosts.forEach(post => {
    if (adminSet.has(post.작성자.toString())) {
      post.isAdmin = true;
      post.isUser = false;
      adminPosts.push(post);
    } else if (loginSet.has(post.작성자.toString())) {
      post.isAdmin = false;
      post.isUser = true;
      userPosts.push(post);
    } else {
      post.isAdmin = false;
      post.isUser = false;
      userPosts.push(post);
    }
  });

  // Sort posts by _id in descending order within each group
  adminPosts.sort((a, b) => b._id - a._id);
  userPosts.sort((a, b) => b._id - a._id);

  // Combine adminPosts and userPosts, with adminPosts first
  const combinedPosts = [...adminPosts, ...userPosts];

  // Paginate the combinedPosts
  const paginatedPosts = combinedPosts.slice((page - 1) * pageSize, page * pageSize);
  const totalPosts = combinedPosts.length;
  const totalPages = Math.ceil(totalPosts / pageSize);

  res.render('First.ejs', { user: req.user, posts: paginatedPosts, currentPage: page, totalPages: totalPages });
});



app.get('/login', function(요청, 응답){
  응답.render('login.ejs')
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      if (info.message === '존재하지 않는 아이디입니다.') {
        return res.redirect('/fail');
      } else if (info.message === '비밀번호가 틀렸습니다.') {
        return res.redirect('/fail');
      } else {
        return res.redirect('/fail2');
      }
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      if (req.body.user === 'admin' && user.userType === 'admin') {
        return res.redirect('/admin');
      } else if (req.body.user === 'user' && user.userType === 'user') {
        return res.redirect('/user');
      } else {
        return res.redirect('/fail2');
      }
    });
  })(req, res, next);
});

app.get('/register', function(요청, 응답){
  응답.render('register.ejs');
})

app.post('/register', function(요청, 응답){
 
  if(요청.body.user === 'user'){
    db.collection('login').insertOne( { id : 요청.body.id, pw : 요청.body.pw, email : 요청.body.email }, function(에러, 결과){
        // 응답.redirect('/login')
        응답.send("<script>alert('회원가입이 성공적으로 완료되었습니다 !'); window.location.href = '/login';</script>");
    } )
  }

  else if(요청.body.user === 'admin') {
    db.collection('admin').insertOne( { id : 요청.body.id, pw : 요청.body.pw, email : 요청.body.email }, function(에러, 결과){
      // 응답.redirect('/login')
      응답.send("<script>alert('회원가입이 성공적으로 완료되었습니다 !'); window.location.href = '/login';</script>");
  } )
  }

  else {
    응답.status(400).send('Invalid user type selected');
  }
})
   
app.get('/user', 로그인했니, async function (req, res) {
  if (req.isAuthenticated() && req.user.userType === 'user') {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = 3;

      // Find all posts
      const allPosts = await db.collection('post').find().toArray();

      const admins = await db.collection('admin').find().toArray();
      const logins = await db.collection('login').find().toArray();

      const adminSet = new Set(admins.map(admin => admin._id.toString()));
      const loginSet = new Set(logins.map(login => login._id.toString()));

      // Separate posts by admin and non-admin
      const adminPosts = [];
      const userPosts = [];

      allPosts.forEach(post => {
        if (adminSet.has(post.작성자.toString())) {
          post.isAdmin = true;
          post.isUser = false;
          adminPosts.push(post);
        } else if (loginSet.has(post.작성자.toString())) {
          post.isAdmin = false;
          post.isUser = true;
          userPosts.push(post);
        } else {
          post.isAdmin = false;
          post.isUser = false;
          userPosts.push(post);
        }
      });

      // Sort posts by _id in descending order within each group
      adminPosts.sort((a, b) => b._id - a._id);
      userPosts.sort((a, b) => b._id - a._id);

      // Combine adminPosts and userPosts, with adminPosts first
      const combinedPosts = [...adminPosts, ...userPosts];

      // Paginate the combinedPosts
      const paginatedPosts = combinedPosts.slice((page - 1) * pageSize, page * pageSize);
      const totalPosts = combinedPosts.length;
      const totalPages = Math.ceil(totalPosts / pageSize);

      res.render('User.ejs', { user: req.user, posts: paginatedPosts, currentPage: page, totalPages: totalPages });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect('/login');
  }
});


app.get('/admin', 로그인했니, async function (req, res) {
  if (req.isAuthenticated() && req.user.userType === 'admin') {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = 3;

      // Find all posts
      const allPosts = await db.collection('post').find().toArray();

      const admins = await db.collection('admin').find().toArray();
      const logins = await db.collection('login').find().toArray();

      const adminSet = new Set(admins.map(admin => admin._id.toString()));
      const loginSet = new Set(logins.map(login => login._id.toString()));

      // Separate posts by admin and non-admin
      const adminPosts = [];
      const userPosts = [];

      allPosts.forEach(post => {
        if (adminSet.has(post.작성자.toString())) {
          post.isAdmin = true;
          post.isUser = false;
          adminPosts.push(post);
        } else if (loginSet.has(post.작성자.toString())) {
          post.isAdmin = false;
          post.isUser = true;
          userPosts.push(post);
        } else {
          post.isAdmin = false;
          post.isUser = false;
          userPosts.push(post);
        }
      });

      // Sort posts by _id in descending order within each group
      adminPosts.sort((a, b) => b._id - a._id);
      userPosts.sort((a, b) => b._id - a._id);

      // Combine adminPosts and userPosts, with adminPosts first
      const combinedPosts = [...adminPosts, ...userPosts];

      // Paginate the combinedPosts
      const paginatedPosts = combinedPosts.slice((page - 1) * pageSize, page * pageSize);
      const totalPosts = combinedPosts.length;
      const totalPages = Math.ceil(totalPosts / pageSize);

      res.render('Admin.ejs', { user: req.user, posts: paginatedPosts, currentPage: page, totalPages: totalPages });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect('/login');
  }
});



app.get('/write', 로그인했니, function (요청, 응답) {
  const isAdmin = 요청.user.userType === 'admin';
  응답.render('write.ejs', {
    사용자: 요청.user,
    isAdmin: isAdmin
  });
});


app.get('/home', function(요청, 응답) {
  응답.redirect('/');
})
 
app.get('/list', 로그인했니, async function (req, res) {
  if (req.isAuthenticated() && (req.user.userType === 'user' || req.user.userType === 'admin')) {
    try {
      const isAdmin = req.user.userType === 'admin';

      const page = parseInt(req.query.page) || 1;
      const pageSize = 3;

      // Find all posts
      const allPosts = await db.collection('post').find().toArray();

      const admins = await db.collection('admin').find().toArray();
      const logins = await db.collection('login').find().toArray();

      const adminSet = new Set(admins.map(admin => admin._id.toString()));
      const loginSet = new Set(logins.map(login => login._id.toString()));

      // Separate posts by admin and non-admin
      const adminPosts = [];
      const userPosts = [];

      allPosts.forEach(post => {
        if (adminSet.has(post.작성자.toString())) {
          post.isAdmin = true;
          post.isUser = false;
          adminPosts.push(post);
        } else if (loginSet.has(post.작성자.toString())) {
          post.isAdmin = false;
          post.isUser = true;
          userPosts.push(post);
        } else {
          post.isAdmin = false;
          post.isUser = false;
          userPosts.push(post);
        }
      });

      // Sort posts by _id in descending order within each group
      adminPosts.sort((a, b) => b._id - a._id);
      userPosts.sort((a, b) => b._id - a._id);

      // Combine adminPosts and userPosts, with adminPosts first
      const combinedPosts = [...adminPosts, ...userPosts];

      // Paginate the combinedPosts
      const paginatedPosts = combinedPosts.slice((page - 1) * pageSize, page * pageSize);
      const totalPosts = combinedPosts.length;
      const totalPages = Math.ceil(totalPosts / pageSize);

      res.render('list.ejs', { user: req.user, posts: paginatedPosts, isAdmin, currentPage: page, totalPages: totalPages });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  } else {
    res.redirect('/login');
  }
});

  
app.delete('/delete', 로그인했니, function(요청, 응답) {
  const postId = parseInt(요청.body._id);
  
  db.collection('post').findOne({ _id: postId }, function (에러, 결과) {
    if (에러) {
      console.error('게시물 조회 중 에러 발생:', 에러);
      return 응답.status(500).send('Internal Server Error');
    }

    if (!결과) {
      console.log('해당 게시물을 찾을 수 없습니다.');
      return 응답.status(404).send('Post Not Found');
    }

    // 게시글 작성자인지 확인
    if (결과.작성자.toString() !== 요청.user._id.toString()) {
      return 응답.status(403).send("<script>alert('본인의 게시글이 아니면 삭제 권한이 없습니다.'); window.location.href = '/list';</script>");
    }

    // 작성자가 맞으면 삭제 처리
    db.collection('post').deleteOne({ _id: postId }, function (삭제에러, 삭제결과) {
      if (삭제에러) {
        console.error('게시물 삭제 중 에러 발생:', 삭제에러);
        return 응답.status(500).send('Internal Server Error');
      }

      if (삭제결과.deletedCount === 0) {
        console.log('해당 게시물을 찾을 수 없습니다.');
        return 응답.status(404).send('Post Not Found');
      }

      console.log('게시물 삭제 완료');
      응답.send("<script>alert('성공적으로 삭제 되었습니다.'); window.location.href = '/list';</script>");
    });
  });
});




app.get('/detail/:id', 로그인했니, function (요청, 응답) {
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    if (에러) { return console.log(에러); }

    const isAdmin = 요청.user.userType === 'admin';
    응답.render('detail.ejs', {
      user: 요청.user,
      data: 결과,
      isAdmin: isAdmin
    });
  });
});


app.get('/edit/:id/:user', 로그인했니, function(요청, 응답){

  const isAdmin = 요청.user.userType === 'admin';

  db.collection('post').findOne({ _id : parseInt(요청.params.id) }, function(에러, 결과){
    if(요청.params.user == 요청.user.id)
     응답.render('edit.ejs', { post : 결과, user: 요청.user, isAdmin });
    else{
      응답.send("<script>alert('본인의 게시글이 아니면 수정할 권한이 없습니다.'); window.location.href = '/list';</script>");
    }
})
})

app.get('/reply/:id', 로그인했니, function (요청, 응답) {
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    if (에러) return console.log(에러);

    const isAdmin = 요청.user.userType === 'admin';
    응답.render('replyForm.ejs', {
      user: 요청.user,
      data: 결과,
      isAdmin: isAdmin
    });
  });
});


app.get('/replyView/:id', 로그인했니, function (요청, 응답) {
  db.collection('post').findOne({ _id: parseInt(요청.params.id) }, function (에러, 결과) {
    if (에러) return console.log(에러);

    db.collection('reply').find({ 게시글번호: 요청.params.id }).toArray((에러2, 결과2) => {
      if (에러2) return console.log(에러2);

      const isAdmin = 요청.user.userType === 'admin';
      응답.render('replyPost.ejs', {
        user: 요청.user,
        data: 결과,
        replys: 결과2,
        isAdmin: isAdmin
      });
    });
  });
});


app.get('/replyResult', 로그인했니, function(요청, 응답){

  const isAdmin = 요청.user.userType === 'admin';

  db.collection('post').findOne({ _id : parseInt(요청.query.id) }, function(에러1, 결과1){
  if(에러1){return console.log(에러1)}

  db.collection('reply').find({ 게시글번호 : 요청.query.id }).toArray((에러2, 결과2) => {
    if(에러2) {return console.log(에러2)}
    console.log(결과2)
    응답.render('replyPost.ejs', { user: 요청.user, data : 결과1, replys : 결과2, isAdmin })
  })

})
})

app.post('/replySubmit', 로그인했니, function(요청, 응답){

  db.collection('reply').insertOne({ 게시글번호: 요청.body.id, 작성자 : 요청.user.id, 댓글내용: 요청.body.content, 작성시간: new Date() }, function(에러2, reply추가){
    if(에러2){return console.log(에러2)}
    console.log(reply추가)
  })
  응답.redirect('/replyResult/?id=' + 요청.body.id) 

})

app.put('/edit', 로그인했니, function(요청, 응답){
 db.collection('post').updateOne({ _id : parseInt(요청.body.id) }, { $set : { 제목: 요청.body.title, 날짜: 요청.body.date, 내용: 요청.body.content } }, function(에러, 결과){
    응답.send("<script>alert('게시글이 수정 되었습니다!'); window.location.href = '/list';</script>");
 })
});

app.get('/mypage', 로그인했니, function (req, res) {
  const isAdmin = req.user && req.user.userType === 'admin';
  console.log(req.user)
  res.render('mypage.ejs', {사용자 : req.user, isAdmin})
})

app.get('/mypageEditor', 로그인했니, function(req, res){
  const isAdmin = req.user && req.user.userType === 'admin';
  res.render('mypageEditor.ejs', {사용자 : req.user, isAdmin})
})

app.put('/myedit', 로그인했니, function(요청, 응답) {
  db.collection('login').updateOne(
    { _id: 요청.user._id },
    { $set: { id: 요청.body.id, email: 요청.body.email, pw: 요청.body.pw } },
    function(에러, 결과) {
      if (에러) {
        console.error('Login 테이블 업데이트 에러:', 에러);
        return 응답.status(500).send('Internal Server Error');
      }

      if (결과.matchedCount === 0) {
        // login 테이블에 해당 사용자가 없으면 admin 테이블을 업데이트
        db.collection('admin').updateOne(
          { _id: 요청.user._id },
          { $set: { id: 요청.body.id, email: 요청.body.email, pw: 요청.body.pw } },
          function(adminError, adminResult) {
            if (adminError) {
              console.error('Admin 테이블 업데이트 에러:', adminError);
              return 응답.status(500).send('Internal Server Error');
            }

            if (adminResult.matchedCount === 0) {
              console.log('해당 사용자를 찾을 수 없습니다.');
              return 응답.status(404).send('User Not Found');
            }

            console.log('Admin 테이블에서 수정완료');
            응답.send("<script>alert('정보가 변경되었습니다!'); window.location.href = '/mypage';</script>");
          }
        );
      } else {
        console.log('Login 테이블에서 수정완료');
        응답.send("<script>alert('정보가 변경되었습니다!'); window.location.href = '/mypage';</script>");
      }
    }
  );
});


app.post('/chatroom',로그인했니, function(요청, 응답){

  var 저장할거 = {
    title : 요청.body.제목,
    member : [ObjectId(요청.body.당한사람id), 요청.user._id],
    date : new Date()
  }

  db.collection('chatroom').insertOne(저장할거).then(function(결과){
    응답.send('저장완료')
  });
});

app.get('/chat', 로그인했니, function(요청, 응답){ 

  db.collection('chatroom').find({ member : 요청.user._id }).toArray().then((결과)=>{
    console.log(결과);
    응답.render('chat.ejs', {data : 결과})
  })
}); 

app.post('/message', 로그인했니, function(요청, 응답){

  var 저장할거 = {
    parent : 요청.body.parent,
    content : 요청.body.content,
    userid : 요청.user._id,
    date : new Date()
  }

  db.collection('message').insertOne(저장할거).then(()=>{
      console.log('DB저장성공')
      응답.send('DB저장성공')
  })
})

app.get('/message/:id', 로그인했니, function(요청, 응답){

  응답.writeHead(200, {
    "Connection": "keep-alive",
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
  });

  db.collection('message').find({ parent : 요청.params.id }).toArray()
  .then((결과)=>{
    응답.write('event: test\n');
    응답.write('data: ' + JSON.stringify(결과) + '\n\n');
  })

   const pipeline = [
     { $match: { 'fullDocument.parent' : 요청.params.id } } 
   ];
   const collection = db.collection('message');
   const changeStream = collection.watch(pipeline);
   changeStream.on('change', (result)=>{
    응답.write('event: test\n');
    응답.write('data: ' + JSON.stringify([result.fullDocument]) + '\n\n');
   });

});
 
//DB에 글저장하는 코드
app.post('/add', function(요청, 응답){
//응답.send('전송완료')
db.collection('counter').findOne({ name : '게시물갯수' }, function(에러, 결과){
    console.log(결과.totalPost)
    var 총게시물갯수 = 결과.totalPost;
    
    var 저장할거 = { _id : 총게시물갯수 + 1, 작성자 : 요청.user._id, 제목 : 요청.body.title, 날짜 : 요청.body.date, 작성자이름 : 요청.body.name, 내용 : 요청.body.content }

    db.collection('post').insertOne(저장할거 , function(에러, 결과){
      console.log('저장완료');
      //counter라는 콜렉션에 있는 totalPost 라는 항목도 1 증가시켜야함 (수정)
      db.collection('counter').updateOne({name:'게시물갯수'},{ $inc : {totalPost:1} },function(에러, 결과){
          if(에러){return console.log(에러)}
          응답.redirect('/list')
      })
  }); 
});
   
});

app.get('/search', 로그인했니, async (req, res) => {
  const searchValue = req.query.value;
  const page = parseInt(req.query.page) || 1;
  const pageSize = 3;
  const regex = new RegExp(searchValue, 'i'); // 'i' for case insensitive

  try {
    const posts = await db.collection('post').find({
      $or: [
        { 제목: regex },
        { 날짜: regex },
        { 작성자이름: regex }
      ]
    })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

    const totalPosts = await db.collection('post').find({
      $or: [
        { 제목: regex },
        { 날짜: regex },
        { 작성자이름: regex }
      ]
    }).count();

    const totalPages = Math.ceil(totalPosts / pageSize);

    const admins = await db.collection('admin').find().toArray();
    const logins = await db.collection('login').find().toArray();

    const adminSet = new Set(admins.map(admin => admin._id.toString()));
    const loginSet = new Set(logins.map(login => login._id.toString()));

    posts.forEach(post => {
      if (adminSet.has(post.작성자.toString())) {
        post.isAdmin = true;
        post.isUser = false;
      } else if (loginSet.has(post.작성자.toString())) {
        post.isAdmin = false;
        post.isUser = true;
      } else {
        post.isAdmin = false;
        post.isUser = false;
      }
    });

    const isAdmin = req.user && req.user.userType === 'admin';
    res.render('search.ejs', { posts, isAdmin, user: req.user, searchValue, currentPage: page, totalPages: totalPages });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});



app.get('/fail',function(요청, 응답){
  응답.send("<script>alert('아이디나 비밀번호를 확인해주세요.'); window.location.href = '/login';</script>");
})

app.get('/fail2', function (req, res) {
  res.send("<script>alert('사용자 유형을 다시 선택해주세요.'); window.location.href = '/login';</script>");
});

passport.use(new LocalStrategy({
  usernameField: 'id',
  passwordField: 'pw',
  session: true,
  passReqToCallback: true,
}, function (req, id, pw, done) {
  const userType = req.body.user;
  const collectionName = (userType === 'admin') ? 'admin' : 'login';

  db.collection(collectionName).findOne({ id: id }, function (err, user) {
    if (err) return done(err);

    if (!user) return done(null, false, { message: '존재 하지 않는 아이디 입니다.' });
    if (pw === user.pw) {
      user.userType = userType;
      return done(null, user);
    } else {
      return done(null, false, { message: '비밀번호가 틀렸습니다.' });
    }
  });
}));

passport.serializeUser(function (user, done) {
  done(null, { id: user.id, userType: user.userType });
});

passport.deserializeUser(function (serializedUser, done) {
  const collectionName = (serializedUser.userType === 'admin') ? 'admin' : 'login';
  db.collection(collectionName).findOne({ id: serializedUser.id }, function (err, user) {
    if (user) {
      user.userType = serializedUser.userType;
      done(null, user);
    } else {
      done(err, false);
    }
  });
});

app.get('/logout', function(요청, 응답){
  요청.session.destroy(function(에러){
      console.log(에러)
  })
  응답.redirect('/login')
})