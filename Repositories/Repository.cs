using Backend_DotNet.Data;
using Backend_DotNet.Models;
using MongoDB.Driver;
using System.Linq.Expressions;

namespace Backend_DotNet.Repositories;

public class Repository<T> : IRepository<T> where T : BaseEntity
{
    protected readonly MongoDbContext _context;
    protected readonly IMongoCollection<T> _collection;

    public Repository(MongoDbContext context, string collectionName)
    {
        _context = context;
        _collection = context.Database.GetCollection<T>(collectionName);
    }

    public IMongoCollection<T> Collection => _collection;

    public virtual async Task<List<T>> GetAllAsync()
    {
        return await _collection.Find(_ => true).ToListAsync();
    }

    public virtual async Task<List<T>> FindAsync(Expression<Func<T, bool>> filter)
    {
        return await _collection.Find(filter).ToListAsync();
    }

    public virtual async Task<T?> GetByIdAsync(int id)
    {
        return await _collection.Find(x => x.Id == id).FirstOrDefaultAsync();
    }

    public virtual async Task<T?> GetByMongoIdAsync(string mongoId)
    {
        return await _collection.Find(x => x.MongoId == mongoId).FirstOrDefaultAsync();
    }

    public virtual async Task<T> CreateAsync(T entity, string sequenceName)
    {
        if (entity.Id <= 0)
        {
            entity.Id = await _context.GetNextSequenceAsync(sequenceName);
        }
        entity.CreatedAt = DateTime.UtcNow;
        entity.UpdatedAt = DateTime.UtcNow;

        await _collection.InsertOneAsync(entity);
        return entity;
    }

    public virtual async Task<bool> UpdateAsync(int id, T entity)
    {
        entity.Id = id;
        entity.UpdatedAt = DateTime.UtcNow;
        var result = await _collection.ReplaceOneAsync(x => x.Id == id, entity);
        return result.ModifiedCount > 0;
    }

    public virtual async Task<bool> DeleteAsync(int id)
    {
        var result = await _collection.DeleteOneAsync(x => x.Id == id);
        return result.DeletedCount > 0;
    }

    public virtual async Task<long> CountAsync(Expression<Func<T, bool>>? filter = null)
    {
        if (filter == null)
            return await _collection.CountDocumentsAsync(_ => true);
        return await _collection.CountDocumentsAsync(filter);
    }
}

