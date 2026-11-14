using Backend_DotNet.Models;
using MongoDB.Driver;
using System.Linq.Expressions;

namespace Backend_DotNet.Repositories;

public interface IRepository<T> where T : BaseEntity
{
    Task<List<T>> GetAllAsync();
    Task<List<T>> FindAsync(Expression<Func<T, bool>> filter);
    Task<T?> GetByIdAsync(int id);
    Task<T?> GetByMongoIdAsync(string mongoId);
    Task<T> CreateAsync(T entity, string sequenceName);
    Task<bool> UpdateAsync(int id, T entity);
    Task<bool> DeleteAsync(int id);
    Task<long> CountAsync(Expression<Func<T, bool>>? filter = null);
    IMongoCollection<T> Collection { get; }
}

