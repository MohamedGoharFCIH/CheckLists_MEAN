const { buildSchema } = require('graphql');

module.exports = buildSchema(`

type Comment {
    _id: ID!
    listID: List!
    comment: String!
    createdAt: String!
    updatedAt: String!
}

type List {
    _id: ID!
    name: String!
    content: String!
    owner_id: User!
    done: Int!
    createdAt: String!
    updatedAt: String!
    comments:[Comment!]!
    expireDate:String!
}

type User {
    _id: ID!
    name: String!
    email: String!
    password: String
    lists: [List!]!
}

input UserInputData {
    email: String!
    name: String!
    password: String!
}

input ListInputData {
    name: String!
    content: String!
    expireDate: String!
}

type AuthData {
    token: String!
    userId: String!
}
type ListData {
    lists: [List!]!
    listsCount: Int! 
}


type RootQuery {
    login(email: String!, password: String!):AuthData!
    list(id: ID!):List
    findLists(listType: String!):ListData!
    listsByDate(selectedDate: String): ListData!
}

type RootMutation {
    createUser(userInput: UserInputData!):User!
    editAccount(name: String!, password: String!): User!
    createList(listInput: ListInputData!):List!
    updateList(id: ID!, listInput: ListInputData!):List!
    checkList(id: ID!, keyword:String!): List!
    deleteList(id: ID!): Boolean!
    addComment(comment: String): Comment!
    editComment(id: ID!, commentInput: String!): Comment!
    deleteComment(id: ID!): Boolean!
    
}

schema {
    query: RootQuery
    mutation: RootMutation
}
`);