Código da publicação do ['artigo'](https://dev.to/brpadilha/criando-um-password-hash-para-seu-usuario-no-banco-de-dados-1g67) publicado no dev.to.

Olá, hoje gostaria de dar uma dica legal para manter a segurança da senha dos usuários que você irá cadastrar no banco de dados, nada mais é do que o password hash.

Estarei usando aqui as tecnologias: Postgres, express, nodejs e o sequelize. E biblioteca que foi utilizada como hash [`bcryptjs`](https://www.npmjs.com/package/bcrypt).

Imagine a tabela users do banco de dados postgres da seguinte forma:

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/xp4imxi3hcdj67ae0joj.png)

O model User.js está assim:

```js
import Sequelize, { Model } from "sequelize";

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default User;
```

E o nosso UserController está assim:

```js

import User from '../models/User';

class UserController {
  async store(req, res) {

    const {
      name,
      email
    } = await User.create(
      req.body,

    );

    return res.json({
      name,
      email
    });
  }

export default new UserController();
```

Onde iremos cadastrar um usuário bem comum, com nome, email e password:

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/6ibmzkbrn811mi1tycd1.png)

Mas podemos agora notar que no banco de dados aparece a senha do usuário que inserimos e isso não é nada seguro:

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/4nx42h40vmjnvot5vw68.png)

O que iremos fazer agora é mudar a migration do usuário para trocar o campo de password para password_hash como mostrado na tabela users:

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/xp4imxi3hcdj67ae0joj.png)

Na no model User podemos passar o password_hash como sequelize.STRING:

```js
import Sequelize, { Model } from "sequelize";

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password_hash: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );

    return this;
  }
}

export default User;
```

Com isso agora no UserController iremos utilizar a função `hash` da biblioteca `bcryptjs` para transformar a password passada no req.body serencriptografada. O segundo parâmetro é o salt, que será o número de vezes que a senha será misturada, aqui usarei 8, sendo que demora cada vez mais tempo para criptografar de acordo com o número de rodadas, como visto na documentação do [`bcryptjs`](https://www.npmjs.com/package/bcrypt):

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/idizkew5z8u6xq5ph9ap.png)

Com isso nosso Controller estará assim:

```js
import User from '../models/User';
import {
  hash
} from 'bcryptjs';


class UserController {
  async store(req, res) {

    const {
      password
    } = req.body

    const passwordHash = await hash(password, 8)

    req.body.password_hash = passwordHash

    console.log(req.body)
    const {
      name,
      email
    } = await User.create(
      req.body,
    );

    return res.json({
      name,
      email
    });
  }

export default new UserController();
```

E olha como ficou o nosso password_hash no banco de dados com um usuário criado com a mesma senha 123456:

![Alt Text](https://dev-to-uploads.s3.amazonaws.com/i/e001x80bev05intuhot1.png)

Muito massa ne?

## EXTRA

Agora nós iremos tirar do controller a criação do password_hash e passaremos para o model do User, primeiro criamos um campo virtual para password, pois iremos usar um addHook que antes de salvar no banco de dados, ele vai passar pela criptografia do hash:

```js
import Sequelize, { Model } from "sequelize";
import bcrypt from "bcryptjs";

class User extends Model {
  static init(sequelize) {
    super.init(
      {
        name: Sequelize.STRING,
        email: Sequelize.STRING,
        password: Sequelize.VIRTUAL,
        password_hash: Sequelize.STRING,
      },
      {
        sequelize,
      }
    );
    // password hash
    this.addHook("beforeSave", async (client) => {
      if (client.password) {
        client.password_hash = await bcrypt.hash(client.password, 8);
      }
    });
    return this;
  }
}

export default User;
```

Assim deixamos o nosso UserController totalmente limpo:

```js
import User from '../models/User';
class UserController {
  async store(req, res) {
    const {
      name,
      email
    } = await User.create(
      req.body,
    );

    return res.json({
      name,
      email
    });
  }
export default new UserController();
```
