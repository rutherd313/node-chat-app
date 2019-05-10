const users = []

const addUser = ({id, username, room}) => {
    //Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    //Validate data
    if (!username || !room) {
        return {
            error: "Username and room are required"
        }
    }

    //check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    //If existingUser is already populated
    if (existingUser) {
        return {
            error: "Username is already in use"
        }
    }

    //Store user
    const user = {id, username, room};
    users.push(user);
    return { user };
}

const removeUser = (id) => {
    //if match not found: -1, else: 0 or >
    //will stop soon as match is found, unlike filter
    const index = users.findIndex((user) => user.id === id)

    if (index !== -1) {
        //rids of one item at the index position found then
        //[0] = object is returned after removed
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id);
}

const getUsersInRoom = (room) => {
    return users.filter((user) => user.room === room);
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
